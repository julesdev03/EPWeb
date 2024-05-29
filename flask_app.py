from flask import Flask, render_template, request, send_file, jsonify, abort
from db_manager import DBMana
from datetime import datetime
import json
import pandas as pd
from PIL import Image, ImageDraw
from io import BytesIO
from global_variables import origin_directory
import os
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import and_, update, insert

app = Flask(__name__)

load_dotenv()

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = (
    'mysql+pymysql://root:root@localhost:3306/EPWeb'
)

db = SQLAlchemy(app)

# SQLAlchemy models

class ListVote(db.Model):
    __tablename__ = 'ListVote'
    id = db.Column(db.Integer, primary_key=True)
    Identifier = db.Column(db.Integer)
    FileNumber = db.Column(db.String(2000))
    Date = db.Column(db.String(2000))
    Type = db.Column(db.String(2000))
    Title = db.Column(db.String(2000))
    InterinstitutionalNumber = db.Column(db.String(2000))
    For = db.Column(db.Integer)
    Against = db.Column(db.Integer)
    Abstention = db.Column(db.Integer)

    def renderAsDic(self):
        return {column.name: getattr(self, column.name) for column in self.__table__.columns}

class PlenaryDates(db.Model):
    __tablename__ = 'Dates'
    id = db.Column(db.Integer, primary_key=True)
    Date = db.Column(db.String(2000))

    def renderAsDic(self):
        return {column.name: getattr(self, column.name) for column in self.__table__.columns}
    
    def renderAsStr(self):
        return self.Date

class MEPs(db.Model):
    __tablename__ = 'MEPs'
    id = db.Column(db.Integer, primary_key=True)
    PersId = db.Column(db.Integer)
    Name = db.Column(db.String(2000))
    EuParty = db.Column(db.String(2000))
    NationalParty = db.Column(db.String(2000))
    EntryDate = db.Column(db.String(2000))
    LeaveDate = db.Column(db.String(2000))
    Country = db.Column(db.String(2000))
    MepId = db.Column(db.String(200))

    def renderAsDic(self):
        return {column.name: getattr(self, column.name) for column in self.__table__.columns}

class archiveMEPs(db.Model):
    __tablename__ = 'archiveMEPs'
    id = db.Column(db.Integer, primary_key=True)
    PersId = db.Column(db.Integer)
    Name = db.Column(db.String(2000))
    EuParty = db.Column(db.String(2000))
    NationalParty = db.Column(db.String(2000))
    EntryDate = db.Column(db.String(2000))
    LeaveDate = db.Column(db.String(2000))
    Country = db.Column(db.String(2000))
    MepId = db.Column(db.String(200))
    DateModification = db.Column(db.String(200))

    def renderAsDic(self):
        return {column.name: getattr(self, column.name) for column in self.__table__.columns}

# DBManagement

def updateBasedOnId(data, table):
    try:
        for update_data in data:
            stmt = (
                update(table).where(table.id == update_data['id']).values({key: value for key, value in update_data.items() if key != 'id'})
            )
            db.session.execute(stmt)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(e)

def addToDb(data, table):
    try:
        for addData in data:
            # print(addData)
            stmt = (
                insert(table).values({key:value for key, value in addData.items() if key !='id'})
            )
            db.session.execute(stmt)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print(e)

@app.route('/')
def hello():
    return render_template('mainpage.html')

# Route for assistants per meps
@app.route('/assistants')
def MepsAssistants():
    return render_template('meps_assistants.html') 

@app.route('/check_vote')
def checkVote():
    return render_template('check_vote.html')

@app.route('/api/language')
def languageAPI():
    f = open(origin_directory+"language.json")
    data = json.load(f)
    return data

@app.route('/api/logos_list')
def logoListAPI():
    f = open(origin_directory+"party_logo.json")
    data = json.load(f)
    party_names = data.keys()
    return json.dumps(list(party_names))

@app.route('/api/logo')
def imgMana():
    args = request.args
    if args.get('party'):
        f = open(origin_directory+'party_logo.json')
        data = json.load(f)
        try:
            img_path = data[args.get('party')]
            if args.get('width') != None and args.get('height') != None:
                print('Path:' + 'logos/'+img_path)
                try:
                    with Image.open(origin_directory+'logos/'+img_path) as img:
                        print('Processing img')
                        img = img.resize((int(args.get('width')), int(args.get('height'))), Image.LANCZOS)
                        img_buffer = BytesIO()
                        img.save(img_buffer, format='PNG')
                        img_buffer.seek(0)
                        return send_file(img_buffer, mimetype='image/gif')
                except Exception as error:
                    print(error)
            else:
                return send_file(origin_directory+'logos/'+img_path, mimetype='image/gif')
        except:
            image = Image.new('RGB', (600, 335), color='white')
            draw = ImageDraw.Draw(image)
            img_buffer = BytesIO()
            image.save(img_buffer, format='PNG')
            img_buffer.seek(0)
            return send_file(img_buffer, mimetype='image/gif')
    return 'Enter a name'

@app.route('/graph')
def graph():
    return render_template('graph_maker.html')

@app.route('/api/meps')
def mepsAPI():
    args = request.args
    mana = DBMana(data_name="meps")
    if args.get('date'):
        input_date = args.get('date')
        input_date = datetime.strptime(input_date, '%Y-%m-%d')
        df1 = mana.csvToDf()
        if 'EntryDate' in df1.columns and not pd.api.types.is_datetime64_any_dtype(df1['EntryDate']):
            df1['EntryDate'] = pd.to_datetime(df1['EntryDate'])
        if 'LeaveDate' in df1.columns and not pd.api.types.is_datetime64_any_dtype(df1['LeaveDate']):
            df1['LeaveDate'] = pd.to_datetime(df1['LeaveDate'])
        filtered_df = df1[(df1['EntryDate'] <= input_date) & (input_date <= df1['LeaveDate'])]
        filtered_df = filtered_df.drop(columns=['EntryDate', 'LeaveDate'])
        df = filtered_df.to_dict(orient='records')
        return json.dumps(df)
    else:
        return mana.csvToJson()

@app.route('/api/dates')
def datesAPI():
    try:
        mana = DBMana(data_name="dates")
        return mana.csvToJson()
    except Exception as error:
        print(error)
        return "Error"

@app.route('/api/list_countries')
def countriesAPI():
    mana = DBMana(data_name="list_countries")
    return mana.csvToJson()

@app.route('/api/assistants_data')
def assistantsAPI():
    args = request.args
    if args.get('type') == 'total':
        mana = DBMana(data_name="total_stats")
        return mana.csvToJson()
    else:
        mana = DBMana(data_name="stats_meps")
        return mana.csvToJson()

@app.route('/assistants/mep/<int:PersId>')
def assistantsMep(PersId):
    origin = "9_"
    # Get basic MEPs data
    mana = DBMana('stats_meps')
    data = mana.csvToJson()
    data = json.loads(data)
    for el in data:
        if int(el['PersId']) == int(PersId):
            mep = el
            if mep['LeaveDate'] == '2024-07-02':
                mep['LeaveDate'] = 'ongoing'
    
    # Get individual assistants
    assistants_data = {'accredited':[], "local": [], "accredited assistants (grouping)":[], "local assistants (grouping)":[]}
    for el in assistants_data.keys():
        mana = DBMana(origin+el)
        df = mana.csvToDf()
        df = df[(df['PersId'] == int(PersId))]
        dictionary = df.to_dict(orient='records')
        for els in dictionary:
            if els['LeaveDate'] == datetime.today().strftime('%Y-%m-%d'):
                els['LeaveDate'] = 'ongoing'
        assistants_data[el] = dictionary
    return render_template('mep_APA.html', mep=mep, data=assistants_data)

@app.route('/saver', methods=['POST'])
def data_receiver():
    # Get if the API_KEY exists and is correct
    try:
        api_key = request.headers.get('Key')
    except:
        abort(403)
    if api_key and api_key == os.getenv('API_KEY'):
        # Get exploitable data
        data = json.loads(request.json)
        try:
            data['Date'] = datetime.strptime(data['Date'], '%d-%m-%Y')
        except:
            return jsonify({"ERROR": "Date incorrect"}), 500
        # Manage input for ListVote
        if data and data['Type']['main'] == 'ListVotes':
            # Get list of dict
            toCompare = ListVote().query.filter_by(Date=datetime.strftime(data['Date'], '%Y-%m-%d'))
            toCompare = [i.renderAsDic() for i in toCompare]
            # Compare with the input
            toModify = []
            toInput = []
            for item in data['Data']:
                matchingResults = [i for i in toCompare if int(i['Identifier']) == int(item['Identifier'])]
                # Get all the items to modify and by what
                if len(matchingResults) > 0:
                    for els in matchingResults:
                        newData =  {i:(els[i] if i not in item.keys() or item[i] == '' or item[i] == els[i] else item[i]) for i in els} 
                        # Check if the new value of the thing is different from the original 
                        if len([i for i in newData if newData[i] not in els.values()]) > 0:
                            toModify.append(newData)  
                else:
                        toInput.append(item)       
            if len(toModify) > 0:
                updateBasedOnId(toModify, ListVote)
            if len(toInput) > 0:
                addToDb(toInput, ListVote)
            return jsonify({"DATA ADDED": "Data succesfully appended."}), 201
        # Handle Dates input
        if data and data['Type']['main'] == 'Dates':
            # Just compare to present dates and add the ones not existing
            listDbDates = PlenaryDates().query.all()
            listDbDates = [i.renderAsStr() for i in listDbDates]
            dataToCompare = data['Data']
            toAdd = [{'Date': i} for i in dataToCompare if i not in listDbDates]
            if len(toAdd) > 0:
                addToDb(toAdd, PlenaryDates)
            return jsonify({"DATA ADDED": "Data succesfully appended."}), 201
        # Handle innput for meps
        if data and data['Type']['main'] == 'CurrentMEPs':
            data['Date'] = datetime.strftime(data['Date'], '%d-%m-%Y')
            allMepsDb = MEPs().query.all()
            allMepsDb = [i.renderAsDic() for i in allMepsDb]
            toModify = []
            toArchive = []
            toAdd = []
            listDataPersId = []
            for mep in data['Data']:
                listDataPersId.append(mep['PersId'])
            # First check if there is data to be modified if yes, archive former data with the date
                correspondingMep = [i for i in allMepsDb if i['PersId'] == mep['PersId']]
                if len(correspondingMep) > 0:
                    correspondingMep = correspondingMep[0]
                    # Check if the new value is different from the original
                    newData = {i:(correspondingMep[i] if i not in mep.keys() or mep[i] == '' or str(mep[i]) == str(correspondingMep[i]) else mep[i]) for i in correspondingMep}
                    test = [i for i in newData if i in correspondingMep.keys() and str(newData[i]) != str(correspondingMep[i])]
                    if len(test) > 0:
                        toModify.append(newData)
                        correspondingMep['DateModification'] = data['Date']
                        toArchive.append(correspondingMep)
                # Check if a new MEP appeared, then add the info + entryDate
                else:
                    if mep['EntryDate'] == '' and data['Type']['subType'] != 'original':
                        mep['EntryDate'] = data['Date']
                    toAdd.append(mep)
            # Check if an MEP disappeared, then leaveDate = Date of the processing
            disappearedMeps = [i for i in allMepsDb if i['PersId'] not in listDataPersId]
            if len(disappearedMeps) > 0:
                for els in [dict(i, **{'DateModification': data['Date']}) for i in disappearedMeps]:
                    toArchive.append(els)
                disappearedMeps = [dict(i, **{'LeaveDate': data['Date']}) for i in disappearedMeps]
            
            # Add to db
            if len(toAdd) > 0:
                addToDb(toAdd, MEPs)
            if len(toArchive) > 0:
                addToDb(toArchive, archiveMEPs)
            if len(toModify) > 0:
                updateBasedOnId(toModify, MEPs)
            if len(disappearedMeps) > 0:
                updateBasedOnId(disappearedMeps, MEPs)      
            
            return jsonify({"DATA ADDED": "Data succesfully appended."}), 201

        

    # If the key is not correct, returns access denied
    else:
        abort(403)

@app.route('/data_test')
def data_test():
    toCompare = ListVote().query.filter_by(Date=datetime.strptime('22-04-2024','%d-%m-%Y'))
    return [i.renderAsDic() for i in toCompare]

if __name__ == '__main__':
    app.run()
