from datetime import datetime
import pandas as pd
import numpy as np
import json
import requests
import os
from global_variables import origin_directory, testing_directory
from datetime import datetime, timedelta
import math
from db_manager import DBMana
import lzip

file_extracted = 'meps_parltrack'
url_download_parltrack_meps = 'https://parltrack.org/dumps/ep_meps.json.lz'
default_entry_date = "2019-07-03"
default_leave_date = "2024-07-02"
json_data_file = 'meps_data.json'

list_type_assistant = ["accredited", "local", "accredited assistants (grouping)", "local assistants (grouping)"]

def returnMeps():
    df = DBMana('meps').csvToDf()
    list_dic = df.to_dict(orient='records')
    return list_dic

def extractPersId(list_meps):
    listPersId = []
    for els in list_meps:
        listPersId.append(els["PersId"])
    return listPersId

def process_json_file(file_path, list_PersId=None):
    list_current_term = []
    with open(origin_directory+file_path, 'r') as file:
        try:
            json_data = json.load(file)
            for els in json_data:
                if els['UserID'] in list_PersId:
                    list_current_term.append(els)
        except OSError as e:
            print(e)          
        # Get all current MEPs in JSON
        with open(origin_directory+json_data_file, 'w') as f:
            f.write(json.dumps(list_current_term))             

def getFullTermMepsPersId(list_meps):
    full_meps = []
    for els in list_meps:
        if els["LeaveDate"] == '2024-07-02' and els["EntryDate"] == "2019-06-02":
            full_meps.append(els['PersId'])
    return full_meps

# Check if the name is not just reverse
def getAltName(name):
    alt_name = name.split(' ')
    family_name = []
    surname = []
    for word in alt_name:
        if word.isupper():
            family_name.append(word)
        else:
            surname.append(word)
    family_name = ' '.join(family_name)
    surname = ' '.join(surname)
    alt_name = surname + ' ' + family_name
    return alt_name

def processChange(name, alt_name, final_data, leave_date, entry_date, PersId):
                                        dic_placeholder = {'Name': '', 'EntryDate': '', 'LeaveDate':'', 'PersId':''}
                                        # Check if existing
                                        check_value = final_data.loc[(final_data['PersId'] == PersId) & ((final_data['Name'].str.upper() == name.upper()) | (final_data['Name'].str.upper() == alt_name.upper()))]
                                        if len(check_value) > 0:
                                            # hasWorked allow to check if the value was added to any row spotted, if not the create a new row with that value
                                            hasWorked = False
                                            # Check if all matching rows can be added the value
                                            for index, line in check_value.iterrows():
                                                # For a leave date, check if it is after start date or if there is no start date
                                                if entry_date != '':
                                                    if (line['EntryDate'] == '') & (line['LeaveDate'] == ''):
                                                        # Find where the line is in the final_data and modify it
                                                        final_data.loc[index, ["EntryDate"]] = entry_date
                                                        # Has worked to indicate no new line to be added
                                                        hasWorked = True
                                                        break
                                                    if (line['EntryDate'] == ''):
                                                        if (datetime.strptime(line['LeaveDate'], '%Y-%m-%d') > datetime.strptime(entry_date, '%Y-%m-%d')):
                                                            # Find where the line is in the final_data and modify it
                                                            final_data.loc[index, ["LeaveDate"]] = entry_date            
                                                            # Has worked to indicate no new line to be added
                                                            hasWorked = True
                                                            break
                                                elif leave_date != '':
                                                    if (line['EntryDate'] == '') & (line['LeaveDate'] == ''):
                                                        # Find where the line is in the final_data and modify it
                                                        final_data.loc[index, ["LeaveDate"]] = leave_date
                                                        # Has worked to indicate no new line to be added
                                                        hasWorked = True
                                                        break
                                                    if (line['LeaveDate'] == ''):
                                                        if (datetime.strptime(line['EntryDate'], '%Y-%m-%d') < datetime.strptime(leave_date, '%Y-%m-%d')):
                                                            # Find where the line is in the final_data and modify it
                                                            final_data.loc[index, ["LeaveDate"]] = leave_date            
                                                            # Has worked to indicate no new line to be added
                                                            hasWorked = True
                                                            break
                                                    if (line['EntryDate'] == leave_date):
                                                        final_data = final_data.drop(index)
                                                        hasWorked = True
                                                        break
                                            # If the date cannot be added to an existing row, add it as a new one
                                            if hasWorked == False:
                                                dic_placeholder['Name'] = name
                                                dic_placeholder['PersId'] = PersId
                                                if leave_date != "":
                                                    dic_placeholder['LeaveDate'] = leave_date
                                                if entry_date != "":
                                                    dic_placeholder['EntryDate'] = entry_date
                                                # Add the row to the df
                                                final_data = pd.concat([final_data, pd.DataFrame(dic_placeholder, index=[0])], ignore_index=True)
                                        # If no match in the table, then add it as a new row
                                        else:
                                            dic_placeholder['Name'] = name
                                            dic_placeholder['PersId'] = PersId
                                            if leave_date != "":
                                                dic_placeholder['LeaveDate'] = leave_date
                                            if entry_date != "":
                                                dic_placeholder['EntryDate'] = entry_date
                                            # Add the row to the df
                                            final_data = pd.concat([final_data, pd.DataFrame(dic_placeholder, index=[0])], ignore_index=True)
                                        return final_data

def processSecond(name, alt_name, PersId, entry_date, final_data, df_changes_second):
    # Check if existing
    check_value = final_data.loc[(final_data['EntryDate'] == '') & (final_data['PersId'] == PersId) & ((final_data['Name'].str.upper() == name.upper()) | (final_data['Name'].str.upper() == alt_name.upper()))]
    if len(check_value) > 0:
        # Check if all matching rows can be added the value
        for index, line in check_value.iterrows():
            dic_placeholder = {'Name': '', 'EntryDate': '', 'LeaveDate':'', 'PersId':''}            
            if entry_date != '':
                # If the date works (entry_date is inferior to leve_date), add to df_changes or modify current line in there
                if (datetime.strptime(line['LeaveDate'], '%Y-%m-%d') > datetime.strptime(entry_date, '%Y-%m-%d')):
                    # if in df_changes_second there is already a matching value, modify it
                    if len(df_changes_second.loc[(df_changes_second['PersId'] == PersId) & ((df_changes_second['Name'].str.upper() == name.upper()) | (df_changes_second['Name'].str.upper() == alt_name.upper())) & (df_changes_second['LeaveDate'] == line['LeaveDate'])]) > 0:
                        df_changes_second.loc[(df_changes_second['PersId'] == PersId) & ((df_changes_second['Name'].str.upper() == name.upper()) | (df_changes_second['Name'].str.upper() == alt_name.upper())) & (df_changes_second['LeaveDate'] == line['LeaveDate']), ['EntryDate']] = entry_date
                    # If not add a new one
                    else:
                        dic_placeholder['Name'] = name
                        dic_placeholder['EntryDate'] = entry_date
                        dic_placeholder['LeaveDate'] = line['LeaveDate']
                        dic_placeholder['PersId'] = PersId
                        df_changes_second = pd.concat([df_changes_second, pd.DataFrame(dic_placeholder, index=[0])], ignore_index=True)
    return df_changes_second
     
def removeDoubles(data):
    # Set up a df that will be returned
    df_to_return = pd.DataFrame(columns=['Name', 'EntryDate', 'LeaveDate', 'PersId'])
    # Order data by date to avoid issues
    data[['EntryDate', 'LeaveDate']] = data[['EntryDate', 'LeaveDate']].apply(pd.to_datetime)
    data.sort_values(by='LeaveDate', inplace = True)
    # Data into a list of dictionaries
    data_dict = data.to_dict('records')
    # Get list of entry dates to compare
    list_entry_date = data['EntryDate'].tolist()
    # Produces a list of alt names only with first and last to avoid the additional names added during the term
    list_alt_names = []
    for name in data['Name']:
        name_alt = name.split(' ')
        list_alt_names.append({name:[name_alt[0].upper(), name_alt[-1].upper()]})
    for assistant in data_dict:
        # Get alt name for this row
        l_alt_name = [assistant['Name'].split(' ')[0].upper(), assistant['Name'].split(' ')[-1].upper()]
        # Withdraw the name of the line from the comparison
        list_alt_names.remove({assistant['Name']:l_alt_name})
        # Compare names
        nameExist = False
        for names in list_alt_names:
            names = names[list(names.keys())[0]]
            if (l_alt_name[0] in names[0]) & (l_alt_name[1] in names[1]):
                nameExist = True
                break
        # Compare dates and get the index of the matching value
        index = 0
        dateExist = False
        for date in list_entry_date:
            if date == assistant['LeaveDate']:
                dateExist = True
                break
            index += 1
        # Check if name and leave_date match values in data
        if (nameExist == True) & (dateExist == True):
            if df_to_return.empty:
                df_to_return = pd.DataFrame({'Name':assistant['Name'], 'EntryDate':assistant['EntryDate'], 'LeaveDate':data_dict[index]['LeaveDate'], 'PersId':assistant['PersId']}, index=[0])
            else:
                df_to_return = pd.concat([df_to_return, pd.DataFrame({'Name':assistant['Name'], 'EntryDate':assistant['EntryDate'], 'LeaveDate':data_dict[index]['LeaveDate'], 'PersId':assistant['PersId']}, index=[0])], ignore_index=True)
            # Delete the other value
            data_dict.pop(index)
            list_entry_date.pop(index)
            continue
        else:
            if df_to_return.empty:
                df_to_return = pd.DataFrame({'Name':assistant['Name'], 'EntryDate':assistant['EntryDate'], 'LeaveDate':assistant['LeaveDate'], 'PersId':assistant['PersId']}, index=[0])
            else:
                df_to_return = pd.concat([df_to_return, pd.DataFrame({'Name':assistant['Name'], 'EntryDate':assistant['EntryDate'], 'LeaveDate':assistant['LeaveDate'], 'PersId':assistant['PersId']}, index=[0])], ignore_index=True)
    
    # Return the df with only the relevant values
    return df_to_return

# Use a function for processing. Make sure first time is different as second will be for starting dates. Need for taking into account already existing. Need for post-processing based on first and last names. Need for processing based on mep leave date as default leave date for their assistants (only for local and accredited not grouping).
def firstProcessing(type_assistant):
    final_data = pd.DataFrame(columns=['Name', 'EntryDate', 'LeaveDate', 'PersId'])
    # Process the data from the json
    with open(origin_directory+json_data_file, 'r') as f:
        data = json.load(f)
        data_meps = DBMana('meps').csvToDf()
        # Process each mep individually
        for mep in data:
            temp_df = pd.DataFrame(columns=['Name', 'EntryDate', 'LeaveDate', 'PersId'])
            list_current = []
            # Get PersId
            PersId = str(mep['UserID'])
            # Start processing current APAs
            try:
                # Parse the current assistants
                if 'assistants' in mep.keys():
                    for assistant_type in mep['assistants']:
                        dic_placeholder = {'Name': '', 'EntryDate': '', 'LeaveDate':'', 'PersId':''}
                        # Get last APA list (not including trainees or grouping or local)
                        if assistant_type == type_assistant:
                            for assistants in mep["assistants"][assistant_type]:
                                dic_placeholder = {'Name': '', 'EntryDate': '', 'LeaveDate':'', 'PersId':''}
                                dic_placeholder['Name'] = assistants
                                dic_placeholder['PersId'] = PersId
                                dic_placeholder['LeaveDate'] = default_leave_date
                                list_current.append(dic_placeholder)

                # Parse all changes from the MEPs page
                for changes in mep['changes']:
                    date_change = str(changes).split('T')[0]

                    # Get changes only after beginning of this term
                    if datetime.strptime(default_entry_date, '%Y-%m-%d') <= datetime.strptime(date_change, "%Y-%m-%d"):             
                        for this_change in mep['changes'][changes]:
                            # Get the change only if APA
                            isAssistant = False
                            isSelectedType = False
                            for path_els in this_change['path']:
                                if 'assistants' in str(path_els):
                                    isAssistant = True
                                if type_assistant == str(path_els):
                                    isSelectedType = True
                            if isAssistant and type(this_change['data']) is dict:
                                if type_assistant in this_change['data'].keys():
                                    isSelectedType = True
                            leave_date = ''
                            entry_date = ''
                            # The date of the change corresponds to leave or entry depending if data was deleted or added
                            if this_change['type'] == 'deleted':
                                leave_date = date_change
                                # If someone was deleted on the starting date do not add
                                if datetime.strptime(leave_date, '%Y-%m-%d') == datetime.strptime(default_entry_date, '%Y-%m-%d'):
                                    break
                            elif this_change['type'] == 'added':
                                entry_date = date_change

                            # Process only if right assistant
                            if isAssistant and isSelectedType:
                                # Setup name value
                                name = ''
                                # If data is a list of names, process them
                                if(type(this_change['data']) is list):
                                    for assistant_name in this_change['data']:
                                        name = assistant_name
                                        alt_name = getAltName(name)
                                        # Process change based on the date and the data provided
                                        temp_df = processChange(name=name, alt_name=alt_name, PersId=PersId, leave_date=leave_date, entry_date=entry_date, final_data=temp_df)
                                
                                # If data is dictionary, process the dict
                                elif isAssistant and type(this_change['data']) is dict:
                                    if type_assistant in this_change['data'].keys():
                                        for assistant_name in this_change['data'][type_assistant]:
                                            name = assistant_name
                                            alt_name = getAltName(name)
                                            temp_df = processChange(name=name, alt_name=alt_name, PersId=PersId, leave_date=leave_date, entry_date=entry_date, final_data=temp_df)

                                # If data is just a string, then no need to process than one name
                                elif isAssistant and type(this_change['data']) is str:
                                    name = this_change['data']
                                    alt_name = getAltName(name)
                                    temp_df = processChange(name=name, alt_name=alt_name, PersId=PersId, leave_date=leave_date, entry_date=entry_date, final_data=temp_df)
                                
                # Process the name of the current assistants
                current_mep_data = data_meps.loc[(data_meps['PersId'] == int(PersId))]
                for assistants in list_current:
                    # Giver the leave date of the MEP or today
                    if current_mep_data['LeaveDate'].to_list()[0] == default_leave_date:
                        assistants['LeaveDate'] = datetime.strftime(datetime.today(), '%Y-%m-%d')
                        alt_name = getAltName(assistants['Name'])
                        temp_df = processChange(name=assistants['Name'], alt_name=alt_name, PersId=PersId, leave_date=assistants['LeaveDate'], entry_date=assistants['EntryDate'], final_data=temp_df)
                    elif datetime.strptime(current_mep_data['LeaveDate'].to_list()[0], '%Y-%m-%d') > datetime.strptime(default_entry_date, '%Y-%m-%d'):
                        assistants['LeaveDate'] = current_mep_data['LeaveDate'].to_list()[0]
                        alt_name = getAltName(assistants['Name'])
                        temp_df = processChange(name=assistants['Name'], alt_name=alt_name, PersId=PersId, leave_date=assistants['LeaveDate'], entry_date=assistants['EntryDate'], final_data=temp_df)

                # Process a second time to get entry dates of remaining assistants based either on change from service provider to assistant or added before the term
                # Impossible to create a new line
                # Check first if there is a need for such processing
                if len(temp_df.loc[(temp_df['PersId'] == PersId) & (temp_df['EntryDate'] == '')]) > 0:
                    df_changes_second = pd.DataFrame(columns=['Name', 'EntryDate', 'LeaveDate', 'PersId'])
                    for changes in mep['changes']:
                        date_change = str(changes).split('T')[0]
                        for this_change in mep['changes'][changes]:
                            # The date of the change corresponds to leave or entry depending if data was deleted or added
                            if (this_change['type'] == 'added') | (this_change['type'] == 'changed'):
                                entry_date = date_change
                                # Get the change only if assistant
                                isAssistant = False
                                isSelectedType = False
                                for path_els in this_change['path']:
                                    if 'assistants' in str(path_els):
                                        isAssistant = True
                                    if type_assistant == str(path_els):
                                        isSelectedType = True
                                # Manage for dictionaries
                                if isAssistant and type(this_change['data']) is dict:
                                    if type_assistant in this_change['data'].keys():
                                        isSelectedType = True                                                    
                                # Process only if right assistant
                                if isAssistant and isSelectedType:
                                    # Setup name value
                                    name = ''
                                    # If data is a list of names, process them
                                    if(type(this_change['data']) is list):
                                        for assistant_name in this_change['data']:
                                            name = assistant_name
                                            alt_name = getAltName(name)
                                            # Process change based on the date and the data provided
                                            df_changes_second = processSecond(name=name, alt_name=alt_name, PersId=PersId, entry_date=entry_date, final_data=temp_df, df_changes_second=df_changes_second)
                                    
                                    # If data is dictionary, process the dict
                                    elif isAssistant and type(this_change['data']) is dict:
                                        if type_assistant in this_change['data'].keys():
                                            for assistant_name in this_change['data'][type_assistant]:
                                                name = assistant_name
                                                alt_name = getAltName(name)
                                                df_changes_second = processSecond(name=name, alt_name=alt_name, PersId=PersId, entry_date=entry_date, final_data=temp_df, df_changes_second=df_changes_second)

                                    # If data is just a string, then no need to process than one name
                                    elif isAssistant and type(this_change['data']) is str:
                                        name = this_change['data']
                                        alt_name = getAltName(name)
                                        df_changes_second = processSecond(name=name, alt_name=alt_name, PersId=PersId, entry_date=entry_date, final_data=temp_df, df_changes_second=df_changes_second)
                    
                    # Add to the temp_df the entry dates
                    for index, line in df_changes_second.iterrows():
                        name = line['Name']
                        alt_name = getAltName(name)
                        temp_df.loc[(temp_df['PersId'] == PersId) & ((temp_df['Name'].str.upper() == name.upper()) | (temp_df['Name'].str.upper() == alt_name.upper())) & (temp_df['LeaveDate'] == line['LeaveDate']), ['EntryDate']] = line['EntryDate']

                # If there are still remaining no entry dates, check if the mep came mid-term with them
                check_value = temp_df.loc[(temp_df['PersId'] == PersId) & (temp_df['EntryDate'] == '')]
                if len(check_value) > 0:
                        if datetime.strptime(current_mep_data['EntryDate'].to_list()[0], '%Y-%m-%d') > datetime.strptime(default_entry_date, '%Y-%m-%d'):
                            for index, line in check_value.iterrows():
                                temp_df.loc[index, ['EntryDate']] = current_mep_data['EntryDate'].to_list()[0]

                # Remove doubles and merge their dates
                temp_df = removeDoubles(temp_df)

                # Merge temp with final_data
                if final_data.empty and not temp_df.empty:
                    final_data = temp_df
                elif not temp_df.empty:
                    final_data = pd.concat([final_data, temp_df], ignore_index=True)

            except OSError as e:
                print(e)

        DBMana(data_name='9_'+type_assistant, data=final_data).dfToCsv()
        # final_data.to_csv(origin_directory+'9_'+type_assistant+".csv", index=False)

        
def testIfRemainingDate(type_assistant):
    # Put in a csv format assistants with no entry or leave date
    df = DBMana('9_'+type_assistant).csvToDf()
    locate_bis = df.loc[(df['EntryDate'].isna()) | (df['LeaveDate'].isna())]
    DBMana(data_name=testing_directory + 'remaining_'+type_assistant, data=locate_bis).dfToCsv()
    # locate_bis.to_csv(origin_directory + testing_directory + 'remaining_'+type_assistant+'.csv', index=False)
    df = df.dropna()
    DBMana(data_name='9_'+type_assistant, data=df).dfToCsv()
    # df.to_csv(origin_directory+'9_'+type_assistant+'.csv')

def downloadAndExtract():
    # Download
    r = requests.get(url_download_parltrack_meps)
    if r.status_code == 200:
        open(origin_directory+file_extracted+'.lz', "wb").write(r.content)
    # Extract
    try:
        buffer = lzip.decompress_file(origin_directory+file_extracted+'.lz')
        decoded = buffer.decode('utf-8')
        decoded = json.loads(decoded)
        with open(origin_directory+file_extracted+'.json', 'w') as f:
            f.write(json.dumps(decoded))
    except OSError as e:
        print(e)

def mepsStats():
    # Total stats
    totalStats = {}
    # Open files
    df_meps_stats = pd.DataFrame(columns=['PersId'])
    df_meps = DBMana('meps').csvToDf()
    # Parse for all assistants types
    for type_assistant in ["accredited", "local", "accredited assistants (grouping)", "local assistants (grouping)"]:
        # Total stats
        totalStats[type_assistant] = {'NbAssistants':0,'DaysAssistants':0}
        # Create a df based on assistant type
        df = DBMana('9_'+type_assistant).csvToDf()
        # pd.read_csv('9_'+type_assistant+'.csv')
        # Get a list of PersId in the table
        listPersId = df['PersId'].unique()
        # Parse all MEPs
        for PersId in listPersId:
            # Get the info about the mep
            reference_mep = df_meps.loc[(df_meps['PersId'] == PersId)]
            # Get the number of assistants
            number_assistants = len(df.loc[(df['PersId'] == PersId)])
            # Get the list of the assistants
            meps_assistants = df.loc[(df['PersId'] == PersId)]
            # Count the average days stayed
            days = timedelta(0)
            count = 0
            for i, line in meps_assistants.iterrows():
                days += datetime.strptime(line['LeaveDate'], '%Y-%m-%d') - datetime.strptime(line['EntryDate'], '%Y-%m-%d')
                count+=1
                # Total stats
                totalStats[type_assistant]['NbAssistants'] += 1
            if days > timedelta(0):
                average_days = str((days/count).days)
            else:
                average_days = '0'
            # Total stats
            totalStats[type_assistant]['DaysAssistants'] += days.days
            # If line not alreay existing, create it
            if len(df_meps_stats.loc[(df_meps_stats['PersId'] == PersId)]) == 0:
                dic_placeholder = {'Name':reference_mep['Name'].to_list()[0], 'Country':reference_mep['Country'].to_list()[0], 'EuParty': reference_mep['EuParty'].to_list()[0], 'NationalParty': reference_mep['NationalParty'].to_list()[0], 'EntryDate':reference_mep['EntryDate'].to_list()[0], 'LeaveDate':reference_mep['LeaveDate'].to_list()[0], 'PersId':PersId, 'accredited':0, 'accredited assistants (grouping)':0, 'local':0, 'local assistants (grouping)':0}
                # Add them to the dictionary
                dic_placeholder[type_assistant] = number_assistants
                # Add the average stay
                dic_placeholder['Avg_days_'+type_assistant] = average_days
                # Add to the df about meps data
                if not df_meps_stats.empty:
                    df_meps_stats = pd.concat([df_meps_stats, pd.DataFrame(dic_placeholder,index=[0])], ignore_index=True)
                else:
                    df_meps_stats = pd.DataFrame(dic_placeholder,index=[0])
            # If line existing change the appropriate value
            else:
                df_meps_stats.loc[df_meps_stats.loc[(df_meps_stats['PersId'] == PersId)].index, [type_assistant]] = number_assistants
                df_meps_stats.loc[df_meps_stats.loc[(df_meps_stats['PersId'] == PersId)].index, ['Avg_days_'+type_assistant]] = average_days
    # Total stats to json
    df_total = []
    for els in totalStats.keys():
        avg_assistants = round((int(totalStats[els]['NbAssistants']))/(int(len(df_meps))),2)
        avg_days = math.floor(((int(totalStats[els]['DaysAssistants']))/(int(totalStats[els]['NbAssistants']))))
        df_total.append({'type':els, 'avg_assistants':avg_assistants,'avg_days':avg_days})
        print(els, avg_days, avg_assistants)
    df_total = pd.DataFrame(df_total)
    df_total.fillna(0, inplace=True)
    DBMana(data_name='total_stats', data=df_total).dfToCsv()
    # df_total.to_csv('total_stats.csv', index=False)

    # Df to csv
    df_meps_stats.fillna(0, inplace=True)
    DBMana(data_name='stats_meps', data=df_meps_stats).dfToCsv()
    # df_meps_stats.to_csv('stats_meps.csv', index=False)

def scrap_assistants():
    print('DOWNLOADING...')
    downloadAndExtract()
    list_persid = extractPersId(returnMeps())
    process_json_file(file_extracted+'.json', list_persid)
    for type_assistant in list_type_assistant:
        print("PROCESSING...")
        firstProcessing(type_assistant)
        print('TESTING...')
        testIfRemainingDate(type_assistant)
    print('STATS...')
    mepsStats()
    # Remove files
    os.remove(origin_directory+file_extracted+'.lz')
    os.remove(origin_directory+file_extracted+'.json')
    os.remove(origin_directory+json_data_file)