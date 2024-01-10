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
    return 'Hello, World!l'

@app.route('/check_vote')
def checkVote():
    return render_template('check_vote.html')

@app.route('/api/logo')
def imgMana():
    args = request.args
    if args.get('party'):
        f = open('party_logo.json')
        data = json.load(f)
        try:
            img_path = data[args.get('party')]
            if args.get('width') != None and args.get('height') != None:
                print('Path:' + 'logos/'+img_path+'.jpg')
                try:
                    with Image.open(origin_directory+'logos/'+img_path+'.jpg') as img:
                        print('Processing img')
                        img = img.resize((int(args.get('width')), int(args.get('height'))), Image.LANCZOS)
                        img_buffer = BytesIO()
                        img.save(img_buffer, format='JPEG')
                        img_buffer.seek(0)
                        return send_file(img_buffer, mimetype='image/gif')
                except Exception as error:
                    print(error)
            else:
                return send_file(origin_directory+'logos/'+img_path+'.jpg', mimetype='image/gif')
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

if __name__ == '__main__':
    app.run()