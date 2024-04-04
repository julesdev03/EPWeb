document.addEventListener("DOMContentLoaded", (event) => {
	let masterMana = new manaApp();
});


function convertListOfDictionariesToCSV(data) {
    // Extract header row from the keys of the first dictionary
    const headerRow = Object.keys(data[0]).join(',') + '\n';
    
    // Extract data rows
    const dataRows = data.map(dictionary =>
        Object.values(dictionary).map(value => `"${value}"`).join(',')
    ).join('\n');

    // Combine header row and data rows
    return headerRow + dataRows;
}

class manaApp {
	constructor(){
		// Table selection
		this.Table = document.getElementById('table-outcome');
		this.tBody = document.getElementById('tbody');
		this.initialize();		
	}

	async initialize() {
		// Get the data
		await this.getData();
		// Replace all dates by ongoing
		this.MepData.forEach((mep) => {
			if(mep.LeaveDate == '2024-07-02') {
				mep.LeaveDate = 'ongoing';
			}
		});

		// Display the data
		this.displayTable("accredited", "descending");

		// Add Event listeners for sorting
		this.eventManagement();

		// Get the arrow down
		let trConcerned = document.getElementById('arrows-tr');
		let el = trConcerned.firstElementChild.firstElementChild;
		el.firstElementChild.className = "arrow-down";

		// Downloader
		let btn = document.getElementById('btn-download');
		btn.addEventListener('click', (e) => {
			let csvData = convertListOfDictionariesToCSV(this.MepData);
			// Create a Blob from the CSV data
			const blob = new Blob([csvData], { type: 'text/csv' });
			// Create a download link
			const downloadLink = document.createElement('a');
			downloadLink.href = URL.createObjectURL(blob);
			downloadLink.download = 'assistants_data.csv';
			// Append the link to the DOM
			document.body.appendChild(downloadLink);
			// Trigger the download
			downloadLink.click();
			// Clean up: remove the link after download
			document.body.removeChild(downloadLink);
		});
	}

	eventManagement() {
		// Add event listener to the arrows
		let trConcerned = document.getElementById('arrows-tr');
		Array.from(trConcerned.children).forEach((el) => {
			Array.from(el.children).forEach((child) => { 
				Array.from(child.children).forEach((divs) => {
					divs.addEventListener('click', e => {
						// Get the relevant values: class and value in order to do the sorting and changing to relevant classname
						let classTarget = e.target.className;
						let valueTarget = e.target.dataset.info;
	
						// Reset all classes
						Array.from(trConcerned.children).forEach((element) => {
							Array.from(element.children).forEach((divContainer) => {
								Array.from(divContainer.children).forEach((div) => {
									div.className = "arrow-div";								
								});
							});
						});
	
						// Set class for this one
						let order = 'ascending';
						if (classTarget == "arrow-div" || classTarget == "arrow-up") {
							e.target.className = "arrow-down";
							order = "descending"
						}
						if (classTarget == "arrow-down") {
							e.target.className = "arrow-up";
							order = "ascending"
						}
	
						this.displayTable(valueTarget, order);	
				});
				
				});
			})
		});
	}

	displayTable(sorter, order, filter_type, filter) {
		// Reset tbody
		this.tBody.innerHTML = ''
		// Filter 
		let data = this.MepData;
		if(filter_type == "group") {
			data = data.filter(item => filter.includes(item.EuParty));
		}
		// and sort the data
		if (order == "descending") {
			data.sort((a, b) => b[sorter] - a[sorter]);
		}
		if (order == "ascending") {
			data.sort((a, b) => a[sorter] - b[sorter]);
		}

		// Display the table
		data.forEach((mep) => {
			// Create the line
			let line = document.createElement('tr');

			// Create the first mep column
			let mepName = document.createElement('td');
			let url = new URL('/assistants/mep/'+mep.PersId, window.location.origin)
			let MepName = mep.Name;
			let EuGroup = mep.EuParty;
			let EntryDate = mep.EntryDate;
			let LeaveDate = mep.LeaveDate;
			let Country = mep.Country;
			// Add to the MEP column the elements
			mepName.innerHTML = `<a href=${url}><b>${MepName}</b></a><p>${EuGroup}</p><p>${Country}</p><p>${EntryDate} - ${LeaveDate}</p>`
			line.appendChild(mepName);
			
			// Add all stats
			let data_name = ['accredited', 'accredited assistants (grouping)', 'local', 'local assistants (grouping)'];
			data_name.forEach((category) => {
				['', 'Avg_days_'].forEach((type) => {
					let td = document.createElement('td');
					td.innerText = mep[type+category];
					line.appendChild(td);
				});
			});

			// Add to the elements
			this.tBody.appendChild(line);			
		});
		
	}

	async getData() {
		this.MepData = await this.getListMeps();
		this.TotalData = await this.getTotalData();
	}

	async getListMeps(){
		return new Promise(async (resolve, reject) => {
			try{
				const url = new URL('api/assistants_data', window.location.origin);
				let response = await fetch(url);
				let data = await response.text();
				let MepData = JSON.parse(data);
				resolve(MepData);				
			} catch(error) {
				console.log(error);
				reject(error);
			}
		}
		);
	}
        

	async getTotalData(){
        return new Promise(async (resolve, reject) => {
			try{
				const url = new URL('api/assistants_data?type=total', window.location.origin);
				let response = await fetch(url);
				let data = await response.text();
				let TotalData = JSON.parse(data);
				resolve(TotalData);				
			} catch(error) {
				console.log(error);
				reject(error);
			}
		}
		);
    }
}