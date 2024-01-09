document.addEventListener("DOMContentLoaded", (event) => {
	let masterMana = new manaApp();
});

class manaApp{
    constructor(){
        this.container = document.getElementById('container');
        this.dateDiv = document.getElementById('date-div');
        this.additionalDiv = document.getElementById('additional-div');
        this.manageDateInput();
        this.getDates();
    }

    async getDates(){
        // Get plenary dates
        try{
            const url = new URL('api/dates', window.location.origin);
            let response = await fetch(url);
            let data = await response.text();
            this.dates_list = JSON.parse(data);
        } catch(error) {
            console.log(error);
        }
    }

    manageDateInput(){
        let dayInput = document.getElementById('day');
        let monthInput = document.getElementById('month');
        let yearInput = document.getElementById('year');
        yearInput.style.width ='4.5ch';
        this.day = '';
        this.month = '';
        this.year = '';

        dayInput.addEventListener('click', (e)=>{
            e.target.select();
        });
        monthInput.addEventListener('click', (e)=>{
            e.target.select();
        });
        yearInput.addEventListener('click', (e)=>{
            e.target.select();
        });

        dayInput.addEventListener('input', (e) => {
            if (e.target.value.length > 2) {
              e.target.value = e.target.value.slice(0, 2);
            }
            if (e.target.value.length == 2){
                monthInput.click();
            }
            this.day = e.target.value;
            this.dateListener();
        }, false);

        monthInput.addEventListener('input', (e) => {
            if (e.target.value.length > 2) {
              e.target.value = e.target.value.slice(0, 2);
            }
            if (e.target.value.length == 2){
                yearInput.click();
            }
            this.month = e.target.value;
            this.dateListener();
        }, false);

        yearInput.addEventListener('input', (e) => {
            if (e.target.value.length > 4) {
              e.target.value = e.target.value.slice(0, 4);
            }
            this.year = e.target.value;
            this.dateListener();
        }, false);

    }

    dateListener(){
        // Emptying the additional div to reset the choice
        this.additionalDiv.innerHTML = '';
        // Checking if part of the plenary dates and displaying error message
        if(document.getElementById('errorDate')){
            // Remove error date if already there
            document.getElementById('errorDate').remove()
          }
          // Check if it is a plenary date
          var date;
          date = this.year + '-'+this.month+'-'+ + this.day;
          this.date = date;
          if(this.dates_list.includes(this.date)){
            if(document.getElementById('zoneDrop')){
                console.log('Unnecessary');
            } else {
                // Get the description
                var textDrop = document.createElement('p');
                textDrop.innerText = 'Pick the xml file here';
                // Create the two buttons
                // Create a div to make the two buttons on the same line
                var btnDropDiv = document.createElement('div');
                btnDropDiv.className = 'btn-drop-div';
                btnDropDiv.style.display = 'flex';
                btnDropDiv.style.flexDirection = 'row';
                btnDropDiv.style.gap = "2.5rem";
                // Creat the button to process the data
                var btnDrop = document.createElement('button');
                btnDrop.innerText = 'Process';
                btnDrop.className = 'Btn black';
                btnDrop.addEventListener('click', this.processData.bind(this));
                // Create upload part:
                // Hidden import necessary: get the name of the file
                this.inputFile = document.createElement('input');
                this.inputFile.type = 'file';
                this.inputFile.accept = '.xml';
                this.inputFile.id = 'input-file';
                this.inputFile.addEventListener('change', (e) => {
                    this.file_uploaded = e.target.files[0];
                });
                btnDropDiv.appendChild(this.inputFile);
                // Assemble the div
                btnDropDiv.appendChild(btnDrop);

                this.additionalDiv.appendChild(textDrop);
                this.additionalDiv.appendChild(btnDropDiv);
            }

          } else {
            // If not a plenary date, display error
            var textError = document.createElement('p');
            textError.innerText = 'Please enter a plenary date';
            textError.style.color = 'red';
            textError.id = 'errorDate';
            this.dateDiv.appendChild(textError);
        }
    }

    async processData(){
        if(this.file_uploaded) {
            // White screen
            const whiteScreen = document.createElement('div');
            whiteScreen.style.width = '100%';
            whiteScreen.style.height = '100%';
            whiteScreen.style.backgroundColor = 'white';
            whiteScreen.style.opacity = '0.7';
            whiteScreen.style.position = 'fixed';
            whiteScreen.style.top = '0';
            whiteScreen.style.left = '0';
            this.container.insertBefore(whiteScreen, this.container.firstChild);

            // Process the data
            var data = await readAsTextAsync(this.file_uploaded);
            this.listVotes = data.listVote;
            this.dataVotes = data.dataVotes;
            console.log(this.listVotes);
            console.log(this.dataVotes);

            // Clear the screen
            this.additionalDiv.innerHTML="";
            whiteScreen.remove();

            // Get the meps based on the date
            this.mepsList = await this.getMeps();

            // Draw the second screen
            this.createMenu();
        }

    }

    async getMeps(){
      return new Promise( async (resolve, reject) => {
        // Get meps based on the date
        try{
            console.log(this.date);
            const url = new URL("api/meps?date="+this.date, window.location.origin);
            let response = await fetch(url);
            let data = await response.text();
            let mepsList = JSON.parse(data);
            console.log(mepsList);
            resolve(mepsList);
        } catch(error) {
            console.log(error);
            reject(error);
        }
    })}

    createMenu() {
      // Will be used to create the search list 
      this.placeHolderMeps = this.mepsList;
      this.selectionMeps = [];
      this.selectionGroups = [];
      this.keepDifferent = false;

      // Get a list of groups
      const uniqueParties = new Set();
      // Iterate through the array and add unique party values to the Set
      this.mepsList.forEach(item => {
        uniqueParties.add(item.EuParty);
      });
      // Convert the Set back to an array if needed
      const uniquePartyArray = [...uniqueParties];
      this.politicalParties = uniquePartyArray;
      console.log(uniquePartyArray);

      // Create the menu
      // Create the input for MEPs
      let divInput = document.createElement('div');
      divInput.className = 'div-input';
      let labelInput = document.createElement('label');
      labelInput.innerText = "Select the MEPs";
      this.mepInput = document.createElement('input');
      this.mepInput.type = 'text';
      this.mepsChoice = document.createElement('ul');
      divInput.appendChild(labelInput);
      divInput.appendChild(this.mepInput);
      divInput.appendChild(this.mepsChoice);
      this.additionalDiv.appendChild(divInput);

      // Create the div containing the MEPs chosen
      let divOutcome = document.createElement('div');
      divOutcome.className = 'div-outcome';
      this.mepsOutcome = document.createElement('ul');
      divOutcome.appendChild(this.mepsOutcome);
      this.additionalDiv.appendChild(divOutcome);

      // Same for the political groups
      // Input
      let divGroups = document.createElement('div');
      divGroups.className = 'div-input';
      let labelGroups = document.createElement('label');
      labelGroups.innerText = "Select the Groups";
      this.groupInput = document.createElement('input');
      this.groupInput.type = 'text';
      this.groupChoice = document.createElement('ul');
      divGroups.appendChild(labelGroups);
      divGroups.appendChild(this.groupInput);
      divGroups.appendChild(this.groupChoice);
      this.additionalDiv.appendChild(divGroups);

      // Create div containing groups chosen
      let divGroupOutcome = document.createElement('div');
      divGroupOutcome.className = 'div-outcome';
      this.groupOutcome = document.createElement('ul');
      divGroupOutcome.appendChild(this.groupOutcome);
      this.additionalDiv.appendChild(divGroupOutcome);

      // Create tickbox for keep different
      let divTick = document.createElement('div');
      divTick.style.gap = ".1rem";
      // divTick.style.width = "80%";
      divTick.style.maxWidth = "20rem";
      divTick.style.display ="flex";
      divTick.style.alignItems ="center";
      divTick.style.flexDirection ="row";
      divTick.style.justifyContent ="center";
      let tickBox = document.createElement('input');
      tickBox.type = 'checkbox';
      let labelTick = document.createElement('label');
      labelTick.innerText = "Keep only the different votes";
      divTick.appendChild(tickBox);
      divTick.appendChild(labelTick);
      this.additionalDiv.appendChild(divTick);
      // Event listener
      tickBox.addEventListener('change', (e)=>{
        if(this.keepDifferent == false){
          this.keepDifferent = true;
        } else {
          this.keepDifferent = false;
        }
        this.createTable();
      });

      // Set up addition, deletion and list of choices
      this.setMepInput();
      this.setGroupInput();
    }

    createTable() {
      if(document.getElementsByClassName('contains-table')[0]){
        document.getElementsByClassName('contains-table')[0].remove();
      }
      // Get a list of all MEPs per group selected
      var listGroups = [];
      this.selectionGroups.forEach(group => {
        var name = group;
        var Meps = this.mepsList.filter(item => item.EuParty == group);
        Meps = Meps.map(x => x.PersId);
        listGroups.push({"Name": group, "MEPs":Meps});
      });
      console.log(listGroups);

      // Create table elements
      // First row
      var divContainsTable = document.createElement('div');
      divContainsTable.className="contains-table";
      var table = document.createElement('table');
      var thread = document.createElement('thread');
      var trThread = document.createElement('tr');
      var thTitle = document.createElement('th');
      thTitle.innerText = 'Title of the vote';
      var thMeps = document.createElement('th');
      thMeps.innerText = "MEPs";
      var thGroups = document.createElement('th');
      thGroups.innerText = "Groups";
      // Append first row
      trThread.appendChild(thTitle);
      trThread.appendChild(thMeps);
      trThread.appendChild(thGroups);
      thread.appendChild(trThread);
      table.appendChild(thread);
      divContainsTable.appendChild(table);

      // Create tbody of table
      var tbody = document.createElement('tbody');
      this.listVotes.forEach(vote => {
        var tr = document.createElement('tr');
        var votes = [];
        // Vote title
        var thVote = document.createElement('th');
        thVote.innerText = vote.Title;

        // Create column with a class for styling the cell
        var thMep = document.createElement('th');
        var divTh = document.createElement('div');
        divTh.className = "class-td";
        var voteIdentifier = vote.Identifier;
        this.selectionMeps.forEach(mep => {
          // Fill with all MEPs, get their vote
            var mepVote = this.dataVotes.filter(item => item.Identifier == voteIdentifier && item.PersId == mep.PersId);
            if(!mepVote[0]){
              var voteMep = 'Absent';
            } else {
              var voteMep = mepVote[0].Vote;
            }
            // List of votes to check if there is a difference
            if(voteMep != "Absent"){
              votes.push(voteMep);
            }
            // Create the div for the name and the canvas
            var divMep = document.createElement('div');
            divMep.className = 'div-mep';
            divMep.innerText = mep.Name;
            var canvas = document.createElement("canvas");
            canvas = drawCanvas(canvas, voteMep);
            divMep.appendChild(canvas);
            divTh.appendChild(divMep);
          }
        );
        // Append the mep cell
        thMep.appendChild(divTh);

        // Political groups management
        var thGroup = document.createElement('th');
        var divGroup = document.createElement('div');
        divGroup.className = "class-td";
        listGroups.forEach(group => {
          // Create the div for the group name and canvas
          var div = document.createElement('div');
          div.innerText = group.Name;
          div.className="div-mep";

          // Calculate the majority vote
          var votesFor = this.dataVotes.filter(item => item.Identifier == voteIdentifier && item.Vote == 'For' && group.MEPs.includes(parseInt(item.PersId))).length;
          var votesAgainst = this.dataVotes.filter(item => item.Identifier == voteIdentifier && item.Vote == 'Against' && group.MEPs.includes(parseInt(item.PersId))).length;
          var votesAbstention = this.dataVotes.filter(item => item.Identifier == voteIdentifier && item.Vote == 'Abstention' && group.MEPs.includes(parseInt(item.PersId))).length;
          var highest = Math.max(votesAbstention, votesAgainst, votesFor);
          var arrayVotes = [votesFor, votesAgainst, votesAbstention];
          var arrayCorresponding = ["For", "Against", "Abstention"];
          var index = arrayVotes.indexOf(highest);

          // Draw the canvas
          var canvas = document.createElement("canvas");
          canvas = drawCanvas(canvas, arrayCorresponding[index]);

          // Push to list of votes for comparison
          votes.push(arrayCorresponding[index]);

          // Append 
          div.appendChild(canvas);
          divGroup.appendChild(div);
        });
        thGroup.appendChild(divGroup);

        // Check if votes are different for background color
        if(votes.every(val => val == votes[0]) == false){
          tr.style.backgroundColor = "rgba(255, 0, 0, 0.473)";
        }
        
        if(this.keepDifferent == true && votes.every(val => val == votes[0]) == false){
          tr.appendChild(thVote);
          tr.appendChild(thMep);
          tr.appendChild(thGroup);

          tbody.appendChild(tr);
        }
        if(this.keepDifferent == false){
          tr.appendChild(thVote);
          tr.appendChild(thMep);
          tr.appendChild(thGroup);

          tbody.appendChild(tr);
        }   
      });
      table.appendChild(tbody);
      this.additionalDiv.appendChild(divContainsTable);



    }

    setGroupInput(){
      this.placeHolderGroup = this.politicalParties;
      this.groupInput.addEventListener('input', (e)=>{
        // Filter based on the input
        var filteredList = this.placeHolderGroup.filter(item => item.toLowerCase().includes(e.target.value.toLowerCase()));
        this.groupChoice.innerHTML = '';
        console.log('CURRENT: '+this.placeHolderGroup);
        // Create li elements
        filteredList.forEach(item => {
          const li = document.createElement('li');
          li.innerText = item;
          li.addEventListener('click', ()=>{
            // Add to the selection list
            this.selectionGroups.push(item);
            // Add to the outcome list
            const li = document.createElement('li');
            li.innerText = item;
            // Create the span for the delete
            const span = document.createElement('span');
            span.innerText = 'x';
            li.appendChild(span);
            // Add the elements to the doc
            this.groupOutcome.appendChild(li);
            // Event listener to delete li when clicking on the cross
            span.addEventListener('click', (e)=>{
                // Add back to the list of fake
                this.placeHolderGroup.push(item);
                // Remove from the choose list
                var index = this.selectionGroups.indexOf(item);
                this.selectionGroups.splice(index,1);
                // Delete the li
                li.remove();
                this.createTable();
            });
            // Resetting values
            this.groupInput.value='';
            this.groupChoice.innerHTML = '';
            var indexGroup = this.placeHolderGroup.indexOf(item);
            this.placeHolderGroup.splice(indexGroup, 1);
            this.createTable();
          });
          this.groupChoice.appendChild(li);
        });
      });

      // If you click outside the input, the lis disappear
      // Timeout is made for the lis not to disappear before the click
      let timeout;
      this.groupInput.addEventListener('focusout', ()=>{
          timeout = setTimeout(()=>{this.groupChoice.innerHTML='';},200); 
      });

      this.groupInput.addEventListener('focus', ()=>{
          clearTimeout(timeout);
      });
    }

    setMepInput(){
      this.mepInput.addEventListener('input', (e)=>{
        // Filter based on the input
          var filteredList = this.placeHolderMeps.filter(item => item.Name.toLowerCase().includes(e.target.value.toLowerCase()));
          this.mepsChoice.innerHTML='';
          console.log('FAKE '+this.placeHolderMeps);
          console.log('FILTERED '+filteredList);

          // Create the li elements based on the filtered list
          filteredList.forEach(item => {
              const li = document.createElement('li');
              li.innerText = item.Name;
              console.log('ITEM '+item.Name);
              li.addEventListener('click', () => {
                  // Handle the selection
                  this.addItemToSelectedList(item);
                  // Reset the input
                  this.mepInput.value = '';
                  this.mepsChoice.innerHTML = '';
                  // Delete the mep from the selection
                  var mepToWithdraw = this.placeHolderMeps.find(i=>i == item);
                  var indexMep = this.placeHolderMeps.indexOf(mepToWithdraw);
                  this.placeHolderMeps.splice(indexMep, 1);
                  console.log('DELETE '+mepToWithdraw.Name);
                  this.createTable();
              });
              this.mepsChoice.appendChild(li);
          });
      });
      // If you click outside the input, the lis disappear
      // Timeout is made for the lis not to disappear before the click
      let timeout;
      this.mepInput.addEventListener('focusout', ()=>{
          timeout = setTimeout(()=>{this.mepsChoice.innerHTML='';},200); 
      });

      this.mepInput.addEventListener('focus', ()=>{
          clearTimeout(timeout);
      });
    }

    addItemToSelectedList(item) {
      // Add to the the list of selected meps
      this.selectionMeps.push(item);
      // Create the li element
      const li = document.createElement('li');
      li.innerText = item.Name;
      // Create the span for the delete
      const span = document.createElement('span');
      span.innerText = 'x';
      li.appendChild(span);
      // Add the elements to the doc
      this.mepsOutcome.appendChild(li);

      // Event listener to delete li when clicking on the cross
      span.addEventListener('click', (e)=>{
          // Add back to the list of fake
          this.placeHolderMeps.push(item);
          // Remove from the choose list
          var index = this.selectionMeps.indexOf(item);
          this.selectionMeps.splice(index,1);
          // Delete the li
          li.remove();
          this.createTable();
      });
  }

}

function drawCanvas(canvas, vote){
  canvas.width = "600";
  canvas.height = "600";
  var ctx = canvas.getContext('2d');
  var x = 300;
  var y = 300;
  var r = 300;
  vote = vote.toUpperCase();

  if(vote == 'AGAINST') {
    // Draw the circle
    ctx.beginPath();
    ctx.arc(x,y,r, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
    // Get the slash: first part
    let coord = polarToCartesian(r*0.6, ((45 * Math.PI) / 180));
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x+coord['x'], y+coord['y']);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 0.3*r;
    ctx.stroke();
    // Get the slash: second part
    let coord2 = polarToCartesian(r*0.6, ((225 * Math.PI) / 180));
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x+coord2['x'], y+coord2['y']);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 0.3*r;
    ctx.stroke();
    // Get the slash: first part
    let cross = polarToCartesian(r*0.6, ((135 * Math.PI) / 180));
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x+cross['x'], y+cross['y']);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 0.3*r;
    ctx.stroke();
    // Get the slash: second part
    let cross2 = polarToCartesian(r*0.6, ((315 * Math.PI) / 180));
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x+cross2['x'], y+cross2['y']);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 0.3*r;
    ctx.stroke();
  }
  if(vote == 'FOR') {
    // Draw the circle
    ctx.beginPath();
    ctx.arc(x,y,r, 0, Math.PI * 2);
    ctx.fillStyle = "green";
    ctx.fill();
    // Draw inside: +
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x+0.6*r, y);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 0.3*r;
    ctx.stroke();
    // Left part
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x-0.6*r, y);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 0.3*r;
    ctx.stroke();
    // Upper part
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y+r*0.6);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 0.3*r;
    ctx.stroke();
    // Lower part
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y-r*0.6);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 0.3*r;
    ctx.stroke();
  }
  if(vote == 'ABSTENTION') {
    // Draw the circle
    ctx.beginPath();
    ctx.arc(x,y,r, 0, Math.PI * 2);
    ctx.fillStyle = "black";
    ctx.fill();
    // Draw inside: -
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x+0.6*r, y);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 0.3*r;
    ctx.stroke();
    // Left part
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x-0.6*r, y);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 0.3*r;
    ctx.stroke();

  }
  if(vote == 'ABSENT') {
    // Draw the circle
    ctx.beginPath();
    ctx.arc(x,y,r, 0, Math.PI * 2);
    ctx.fillStyle = "grey";
    ctx.fill();
    // Get the slash: first part
    let coord = polarToCartesian(r*0.6, ((130 * Math.PI) / 180));
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x+coord['x'], y+coord['y']);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 0.3*r;
    ctx.stroke();
    // Get the slash: second part
    let coord2 = polarToCartesian(r*0.6, ((310 * Math.PI) / 180));
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x+coord2['x'], y+coord2['y']);
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 0.3*r;
    ctx.stroke();
  }
  return canvas
}

function polarToCartesian(radius, angle) {
  var x = radius * Math.cos(angle);
  var y = radius * Math.sin(angle);
  return { "x": x, "y": y };
}

function readAsTextAsync(file) {
    return new Promise( (resolve, reject) => {
        try {
            var reader = new FileReader();
  
            reader.onload = function(e) {
                let fileContents = e.target.result;
                const xmlDoc = new DOMParser().parseFromString(fileContents, 'text/xml');
                data = extractData(xmlDoc);
                resolve(data);
            }
  
            reader.readAsText(file);
        } catch(error) {
            reject(error);
        }
    } );
  }

  function extractData(xmlDoc) {
    // Get alls votes nodes
    const elements = xmlDoc.getElementsByTagName('RollCallVote.Result');
    // Set up vars
    var listVotes = [];
    var dataVotes = [];

    // Parse votes
    for(let i = 0; i < elements.length; i++) {
      // Get the title of the vote
      let rcvText = elements[i].getElementsByTagName('RollCallVote.Description.Text')[0]
      let voteTitle = ""
      let voteIdentifier = elements[i].getAttribute('Identifier')
      for(let j = 0; j < rcvText.childNodes.length; j++) {
        const childNode = rcvText.childNodes[j];
        voteTitle += childNode.textContent
      }
      // Append title votes list with identifier / title
      listVotes.push({'Title': voteTitle, 'Identifier': voteIdentifier})

      // Get all Meps voting for it
      // First get Result for
      let resultFor = elements[i].getElementsByTagName('Result.For')[0]
      if(resultFor) {
        // Then parse the political groups
        for(let j = 0; j < resultFor.childNodes.length; j++) {
          // Get all individual meps in there
          let mepNodes = resultFor.childNodes[j].getElementsByTagName('PoliticalGroup.Member.Name')
          for(let z = 0; z < mepNodes.length; z++) {
          // Get their PersId
            let mepIdentifier = mepNodes[z].getAttribute('PersId')
            // Add the data to the list
            dataVotes.push({'Identifier': voteIdentifier, 'PersId': mepIdentifier, 'Vote': 'For'})
          }
        }
      }

      // Get all Meps voting against it
      // First get Result for
      let resultAgainst = elements[i].getElementsByTagName('Result.Against')[0]
      if(resultAgainst) {
        // Then parse the political groups
        for(let j = 0; j < resultAgainst.childNodes.length; j++) {
          // Get all individual meps in there
          let mepNodes = resultAgainst.childNodes[j].getElementsByTagName('PoliticalGroup.Member.Name')
          for(let z = 0; z < mepNodes.length; z++) {
          // Get their PersId
            let mepIdentifier = mepNodes[z].getAttribute('PersId')
            // Add the data to the list
            dataVotes.push({'Identifier': voteIdentifier, 'PersId': mepIdentifier, 'Vote': 'Against'})
          }
        }
      }

      // Get all Meps voting abstention
      // First get Result for
      let resultAbstention = elements[i].getElementsByTagName('Result.Abstention')[0]
      if (resultAbstention) {
        // Then parse the political groups
        for(let j = 0; j < resultAbstention.childNodes.length; j++) {
          // Get all individual meps in there
          let mepNodes = resultAbstention.childNodes[j].getElementsByTagName('PoliticalGroup.Member.Name')
          for(let z = 0; z < mepNodes.length; z++) {
          // Get their PersId
            let mepIdentifier = mepNodes[z].getAttribute('PersId')
            // Add the data to the list
            dataVotes.push({'Identifier': voteIdentifier, 'PersId': mepIdentifier, 'Vote': 'Abstention'})
          }
        }
      }
    }
    return {'listVote':listVotes, 'dataVotes':dataVotes}
  }