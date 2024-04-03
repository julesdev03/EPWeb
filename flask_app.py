from flask import Flask, render_template, request, send_file
from db_manager import DBMana
from datetime import datetime
import json
import pandas as pd
from PIL import Image, ImageDraw
from io import BytesIO
from global_variables import origin_directory

app = Flask(__name__)

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

if __name__ == '__main__':
    app.run()
