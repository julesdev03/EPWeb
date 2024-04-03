document.addEventListener("DOMContentLoaded", (event) => {
	let masterMana = new manaApp();
});

class manaApp{
    urlVote = ['https://www.europarl.europa.eu/doceo/document/PV-9-{date}-RCV_EN.xml', 'https://www.europarl.europa.eu/doceo/document/PV-9-{date}-RCV_FR.xml']
    constructor(){
        this.file_uploaded = null;
        this.voteChoice = null;
        this.outcome = null;
        this.titleText = "";
        this.dataVotes = [];
        this.listVotes = [];
        this.container = document.getElementById('container');
        this.dateDiv = document.getElementById('date-div');
        this.additionalDiv = document.getElementById('additional-div');
        this.getDates();
        this.getCountries();
        this.getLanguage();
        this.getLogosList();
        this.manageDateInput();
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

    async getLogosList(){
        try{
            const url = new URL('api/logos_list', window.location.origin);
            let response = await fetch(url);
            let data = await response.text();
            this.logosList = JSON.parse(data);
            console.log(this.logosList);
        } catch(error) {
            console.log(error);
        }
    }

    async getDates(){
        // Get plenary dates
        try{
            const url = new URL('api/dates', window.location.origin);
            let response = await fetch(url);
            let data = await response.text();
            this.dates_list = JSON.parse(data);
            console.log(this.dates_list);
        } catch(error) {
            console.log(error);
        }
    }

    dateListener() {
        // Emptying the additional div to reset the choice
        this.additionalDiv.innerHTML = '';
        // Checking if part of the plenary dates and displaying error message
        if(document.getElementById('errorDate')){
            // Remove error date if already there
            document.getElementById('errorDate').remove()
          }
          // Check if it is a plenary date
          var date;
          date = this.year + '-'+this.month+'-'+ this.day;
          this.date = date;
          if(this.dates_list.includes(this.date)){
            // If good date, display download btn
            var Btn = document.createElement('button');
            Btn.innerText = 'Download the file';
            Btn.className = 'black Btn';
            Btn.addEventListener('click', () => {
                // Specify the URL to open
                var urlToOpen = [this.urlVote[0].replace('{date}', this.date)];
                urlToOpen.push(this.urlVote[1].replace('{date}', this.date));
                // // Call the openUrlInNewTab function to open the URL in a new tab for both links
                window.open(urlToOpen[0], '_blank');
                window.open(urlToOpen[1], '_blank');
            });
            this.additionalDiv.appendChild(Btn);
            this.displayDropElement();
          } else {
            // If not a plenary date, display error
            var textError = document.createElement('p');
            textError.innerText = 'Please enter a plenary date';
            textError.style.color = 'red';
            textError.id = 'errorDate';
            this.dateDiv.appendChild(textError);
        }
    }

    displayDropElement(){
        if(document.getElementById('zoneDrop')){
            console.log('Unnecessary');
        } else {
            // Get the description
            var textDrop = document.createElement('p');
            textDrop.innerText = 'Drop the xml file here';

            // Create the div for the zone drop
            var zoneDrop = document.createElement('div');
            zoneDrop.id = 'zoneDrop';
            // Prevent the normal drop behaviour
            zoneDrop.addEventListener('dragover', (e) => {
                e.preventDefault();
            });
            // Change background when hovering
            zoneDrop.addEventListener("dragenter", function() {
                zoneDrop.style.backgroundColor = '#808080';
            }, false);
            zoneDrop.addEventListener("dragleave",function() {
                zoneDrop.style.backgroundColor = '#FFFFFF'
            },false);
            // Manage the drop
            zoneDrop.addEventListener('drop', (e) => {
                // Prevent opening
                e.preventDefault();
                // Get the file
                this.file_uploaded = e.dataTransfer.files[0];
                // Background color
                e.target.style.backgroundColor = '#FFFFFF';

                if (this.file_uploaded && this.file_uploaded.name.endsWith('.xml')) {
                    // Insert the name of the file in the drop
                    e.target.innerHTML = "";
                    var textFile = document.createElement('p');
                    textFile.innerText = this.file_uploaded.name;
                    e.target.appendChild(textFile);
                }
            });

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
            if(!this.inputFile){
                this.inputFile = document.createElement('input');
                this.inputFile.type = 'file';
                this.inputFile.accept = '.xml';
                this.inputFile.style.display = 'none';
                this.inputFile.id = 'input-file';
                this.inputFile.addEventListener('change', (e) => {
                    this.file_uploaded = e.target.files[0];
                    console.log(this.file_uploaded);
                    zoneDrop.innerHTML = "";
                    var textFile = document.createElement('p');
                    textFile.innerText = this.file_uploaded.name;
                    zoneDrop.appendChild(textFile);
                });
            }
            // Button to choose file: just click the input
            var btnUpload = document.createElement('button');
            btnUpload.innerText = 'Upload';
            btnUpload.className = 'Btn red';
            btnUpload.addEventListener('click', (e) => {
                this.inputFile.click();
            });
            // Assemble the div
            btnDropDiv.appendChild(btnDrop);
            btnDropDiv.appendChild(btnUpload);

            // Final assembling
            this.additionalDiv.appendChild(textDrop);
            this.additionalDiv.appendChild(zoneDrop);
            this.additionalDiv.appendChild(btnDropDiv);
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
            this.getMeps();

            this.createMenu();
        }
    }

    async getMeps(){
        // Get meps based on the date
        try{
            console.log(this.date);
            const url = new URL('api/meps?date='+this.date, window.location.origin);
            let response = await fetch(url);
            let data = await response.text();
            this.mepsList = JSON.parse(data);
            console.log(this.mepsList);
        } catch(error) {
            console.log(error);
        }
    }

    async getLanguage(){
        // Get meps based on the date
        try{
            const url = new URL('api/language', window.location.origin);
            let response = await fetch(url);
            let data = await response.text();
            this.language = JSON.parse(data);
            console.log(this.language);
        } catch(error) {
            console.log(error);
        }
    }

    createMenu() {
        // Create choice of language
        var divLanguageChoice = document.createElement('div');
        divLanguageChoice.className = 'divSmallContainer';
        let labelLanguageChoice = document.createElement('label');
        labelLanguageChoice.innerText = 'Choose the language';
        let selectLanguageChoice = document.createElement('select');
        // Get all languages
        let languages = Object.keys(this.language);
        this.chosenLanguage = null;
        // Create all options for the select element
        for(let i = 0; i<languages.length;i++){
            let optionEl = document.createElement('option');
            optionEl.innerText = languages[i];
            optionEl.value = languages[i];
            optionEl.title = languages[i];
            selectLanguageChoice.appendChild(optionEl);
            // Make the first option the chose one
            if(i == 0) {
                this.chosenLanguage = this.language[languages[i]];
            }
        }
        divLanguageChoice.appendChild(labelLanguageChoice);
        divLanguageChoice.appendChild(selectLanguageChoice);

        // Create choice of vote
        var divVoteChoice = document.createElement('div');
        divVoteChoice.className = 'divSmallContainer';
        let labelVoteChoice = document.createElement('label');
        labelVoteChoice.innerText = 'Choose the vote';
        let selectVoteChoice = document.createElement('select');
        let votes = []
        // Extract only votes titles into a list
        for(let i = 0; i < this.listVotes.length; i++) {
            votes.push(this.listVotes[i]['Title'])
        }
        // Create html elements
        for(let i = -1; i < votes.length; i++) {
            let optionEl = document.createElement('option');
            // Create an empty option
            if(i == -1) {
                optionEl.innerText = ''
                optionEl.value = ''
            } else {
                let vote = votes[i]
                // Truncate the text in the middle
                optionEl.innerText = vote;
                optionEl.value = vote
                optionEl.title = vote
            }
            selectVoteChoice.appendChild(optionEl);
        }
        divVoteChoice.appendChild(labelVoteChoice);
        divVoteChoice.appendChild(selectVoteChoice);

        // Country list choice
        var divCountryChoice = document.createElement('div');
        divCountryChoice.className = 'divSmallContainer';
        var labelCountryChoice = document.createElement('label');
        labelCountryChoice.innerText = 'Choose the country';
        var selectCountryChoice = document.createElement('select');
        // Create html elements
        for(let i = -1; i < this.listCountries.length; i++) {
            let optionEl = document.createElement('option');
            // Create an empty option
            if(i == -1) {
                optionEl.innerText = ''
                optionEl.value = ''
            } else {
                // Truncate the text in the middle
                optionEl.innerText = this.listCountries[i];
                optionEl.value = this.listCountries[i]
                optionEl.title = this.listCountries[i]
            }
            selectCountryChoice.appendChild(optionEl);}
        divCountryChoice.appendChild(labelCountryChoice);
        divCountryChoice.appendChild(selectCountryChoice);

        // Logos list choice
        var divLogosChoice = document.createElement('div');
        divLogosChoice.className = 'divSmallContainer';
        var labelLogosChoice = document.createElement('label');
        labelLogosChoice.innerText = 'Choose the logo to be displayed next to the title';
        var selectLogosChoice = document.createElement('select');
        // Create html elements
        for(let i = -1; i < this.logosList.length; i++) {
            let optionEl = document.createElement('option');
            // Create an empty option
            if(i == -1) {
                optionEl.innerText = ''
                optionEl.value = ''
            } else {
                // Truncate the text in the middle
                optionEl.innerText = this.logosList[i];
                optionEl.value = this.logosList[i]
                optionEl.title = this.logosList[i]
            }
            selectLogosChoice.appendChild(optionEl);}
        // Get Pirates selected as default
        if(this.logosList.indexOf('European Pirates')) {
            let indexLogo = this.logosList.indexOf('European Pirates');
            selectLogosChoice.selectedIndex = indexLogo +1;
            this.chosenLogo = 'European Pirates';
        } else {
            selectLogosChoice.selectedIndex = 0;
            this.chosenLogo = '';
        }       
        // Append
        divLogosChoice.appendChild(labelLogosChoice);
        divLogosChoice.appendChild(selectLogosChoice);

        // Title of the graph
        var divTitleInput = document.createElement('div');
        divTitleInput.className = 'divSmallContainer';
        var labelTitle = document.createElement('label');
        labelTitle.innerText = 'Type the title of the vote graph';
        var inputTitle = document.createElement('input');
        inputTitle.type = 'text';
        divTitleInput.appendChild(labelTitle);
        divTitleInput.appendChild(inputTitle);

        // Merge and display
        this.additionalDiv.appendChild(divVoteChoice);
        this.additionalDiv.appendChild(divCountryChoice);
        this.additionalDiv.appendChild(divLanguageChoice);
        this.additionalDiv.appendChild(divTitleInput);
        this.additionalDiv.appendChild(divLogosChoice);
        this.canvaMana = new canvaMana(this.chosenLanguage);
        this.canvaMana.titleMana(this.titleText, this.chosenLogo);
        this.createDownload();

        // Event listeners: title management
        inputTitle.addEventListener('input', (e)=>{
            this.titleText = e.target.value,
            this.canvaMana.titleMana(this.titleText, this.chosenLogo);
        });

        // Event Listener logo choice
        selectLogosChoice.addEventListener('change', (e) => {
            this.chosenLogo = e.target.value;
            this.canvaMana.titleMana(this.titleText, this.chosenLogo);
        });

        // Event listener: select the vote: write the title and the outcome
        selectVoteChoice.addEventListener('change', async (e)=>{
            if(divVoteChoice.getElementsByClassName('divSmallContainer')[0]){
                divVoteChoice.getElementsByClassName('divSmallContainer')[0].remove();
            }
            this.voteChoice = e.target.value;
            this.outcome = this.getOutcome();
            this.canvaMana.setAllFooter(e.target.value, this.outcome, this.chosenLanguage);
            // Check if the length of the voteChoice is more than 3 lines
            if(this.canvaMana.checkLengthVoteChoice(e.target.value)){
                let divInputVoteChoice = document.createElement('div');
                divInputVoteChoice.className= 'divSmallContainer';
                let labelInputVoteChoice = document.createElement('label')
                labelInputVoteChoice.id = 'labelInputVoteChoice';
                labelInputVoteChoice.innerText = 'Enter a short version of the name of the vote chosen';
                labelInputVoteChoice.style.color = 'red';
                let inputVoteChoice = document.createElement('input');
                inputVoteChoice.id = 'inputVoteChoice';
                inputVoteChoice.value = e.target.value;
                inputVoteChoice.type = 'text';
                divInputVoteChoice.appendChild(labelInputVoteChoice);
                divInputVoteChoice.appendChild(inputVoteChoice);
                divVoteChoice.appendChild(divInputVoteChoice);

                inputVoteChoice.addEventListener('input', (e)=> {
                    this.canvaMana.setAllFooter(e.target.value, this.outcome, this.chosenLanguage);
                });
            }
            let mergedArray = await this.startMepsLayout();
            this.canvaMana.processMepsLayout(mergedArray);
        });

        // Process when country is chosen
        selectCountryChoice.addEventListener('change', async (e)=> {
            this.countryChoice = e.target.value;
            let mergedArray = await this.startMepsLayout();
            this.canvaMana.processMepsLayout(mergedArray);
        });

        // Event Listener: language
        selectLanguageChoice.addEventListener('change', (e)=>{
            this.chosenLanguage = this.language[e.target.value];
            if(this.voteChoice != null && this.outcome != null){
                this.canvaMana.setAllFooter(this.voteChoice, this.outcome, this.chosenLanguage);
            } else {
                this.canvaMana.footerBlue(this.chosenLanguage);
            }
        })
    }

    startMepsLayout() {
        return new Promise ((resolve, reject) => {
            try {
                if (this.Identifier && this.countryChoice !="" && this.countryChoice) {
                    // Filter the data to only get the MEPs of the country + votedata only for the specific vote
                    let votes = this.dataVotes.filter(item => item.Identifier == this.Identifier);
                    let mepdata = this.mepsList.filter(item => item.Country == this.countryChoice);

                    // Only keep interesting values in the dic Name, Vote, NationalParty, EuParty
                    const mergedArray = mepdata.map(secondItem => {
                        const matchingVoteItem = votes.find(voteItem => voteItem.PersId == secondItem.PersId);
                        if (matchingVoteItem) {
                            // Only keep chosen attributes from both objects
                            return {
                                'Name': secondItem.Name,
                                'Vote': matchingVoteItem.Vote,
                                'NationalParty': secondItem.NationalParty,
                                'EuParty': secondItem.EuParty
                            };
                        }
                        return {
                            'Name': secondItem.Name,
                            'Vote': 'Absent',
                            'NationalParty': secondItem.NationalParty,
                            'EuParty': secondItem.EuParty
                        } // Handle the case where no match is found
                    });
                    // Start to process for the layout
                    const euPartyOrder = ['The Left', 'Greens/EFA', 'S&D', 'Renew', 'EPP', 'ECR', 'ID', 'NI'];

                    mergedArray.sort((a, b) => {
                        // Compare EuParty
                        const partyOrderA = euPartyOrder.indexOf(a.EuParty);
                        const partyOrderB = euPartyOrder.indexOf(b.EuParty);
                        if (partyOrderA < partyOrderB) return -1;
                        if (partyOrderA > partyOrderB) return 1;

                        // If EuParty is the same, compare NationalParty
                        if (a.NationalParty < b.NationalParty) return -1;
                        if (a.NationalParty > b.NationalParty) return 1;

                        return 0; // Objects are equal in sorting criteria
                    });
                    // Get Patrick Breyer first
                    // Get his vote based on name
                    let PatrickVote = mergedArray.filter(item => item.Name == "Patrick Breyer");
                    // If he voted, get him first and wihdraw his vote from the other spot
                    if(PatrickVote.length > 0){
                        let index = mergedArray.indexOf(PatrickVote[0]);
                        mergedArray.splice(index, 1);
                        mergedArray.unshift(PatrickVote[0]);                     
                    }
                    // Resolve with the data
                    resolve(mergedArray);
                }
            } catch(error) {
                reject(error);
            }});
    }

    getOutcome() {
        // Get the data from the dic on what the title corresponds to in terms of identifier
        const result = this.listVotes.find(item => item.Title == this.voteChoice);
        this.Identifier = result ? result.Identifier : null;
        console.log(this.dataVotes.filter(item => item.Vote == 'Abstention'));
        // Extract the data
        let outcome = {};
        outcome['FOR'] = this.dataVotes.filter(item => item.Identifier == this.Identifier && item.Vote == 'For').length;
        outcome['AGAINST'] = this.dataVotes.filter(item => item.Identifier == this.Identifier && item.Vote == 'Against').length;
        outcome['ABSTENTION'] = this.dataVotes.filter(item => item.Identifier == this.Identifier && item.Vote == 'Abstention').length;
        return outcome;
    }

    async getCountries() {
        try{
            const url = new URL('api/list_countries', window.location.origin);
            let response = await fetch(url);
            let data = await response.text();
            this.listCountries = JSON.parse(data);
            console.log(this.listCountries);
        } catch(error) {
            console.log(error);
        }
    }

    createDownload(){
        // Create a btn that creates an img out of the canvas and downloads it
        let btn = document.createElement('button');
        btn.innerText = 'Download the picture';
        btn.addEventListener('click', (e) => {
            let link = document.createElement('a');
            let url = this.canvaMana.canvas.toDataURL('image/png');
            link.href = url;
            link.download = 'graph.png';
            link.click();
        })
        this.additionalDiv.appendChild(btn);
    }
}

class canvaMana{
    darkBlue = '#00008B';
    fontCanvas = "Tahoma";
    red = 'red';
    green = 'green';
    orange= 'black';
    grey = 'grey';
    chosenLogo = '';

    constructor(language){
        // Set up the canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = '1200';
        this.canvas.height = '628';
        let additionalDiv = document.getElementById('additional-div');
        additionalDiv.appendChild(this.canvas);

        // Get the ctx
        this.ctx = this.canvas.getContext('2d');
        // White background
        console.log(this.canvas.width);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        // Set up header and footer
        this.headerHeight = this.canvas.height*0.18;
        this.footerHeight = this.canvas.height*0.15;
        this.ctx.imageSmoothingEnabled = true;
        this.headerBlue();
        this.footerBlue(language);
    }

    headerBlue() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.headerHeight);
        this.ctx.fillStyle = this.darkBlue;
        this.ctx.fillRect(0, 0, this.canvas.width, this.headerHeight);
    }

    footerBlue(language) {
        // Delete and draw the blue rectangle
        this.ctx.clearRect(0, (this.canvas.height-this.footerHeight), this.canvas.width, (this.footerHeight));
        this.ctx.fillStyle = this.darkBlue;
        this.ctx.fillRect(0, (this.canvas.height-this.footerHeight), this.canvas.width, (this.footerHeight));
        // Draw votes indications
        this.drawVotesIndications(language);
    }

    setAllFooter(titleText, outcome, language) {
        this.footerBlue(language);
        this.writeVote(titleText, language);
        this.writeOutcome(outcome, language);
    }

    drawLogo(url, coordinates) {
        return new Promise ((resolve, reject) => {
            try {
                const img = new Image();
                img.src=url;
                img.onload = () => {
                    this.ctx.drawImage(img, coordinates[0], coordinates[1], coordinates[2], coordinates[3]);
                    resolve();
                }
            } catch(error) {
                reject(error);
            }
        } );
    }

    async processMepsLayout(data) {
        // Decide on the number of MEPs per column
        let Xpadding = ((5*this.canvas.width)/600);
        let Ypadding = ((5*this.canvas.height)/335);

        let mepsPerColumn = Math.ceil(data.length / 5);

        let pxPerMep = (this.canvas.height - (this.headerHeight + this.footerHeight + Ypadding*1.5))/mepsPerColumn;
        let columnWidth = (this.canvas.width - Xpadding)/5;
        let realColumnWidth = columnWidth-((5*this.canvas.width)/600);
        let realpxPerMep = pxPerMep-((2*this.canvas.height)/335);
        let logoWidth = realpxPerMep * 1.77;
        let logoToTextPadding = realColumnWidth*0.02;

        let mepCount = 0;
        let YPoint = Ypadding+this.headerHeight;
        let XPoint = Xpadding;

        // Clear the rectangle
        this.ctx.clearRect(0, YPoint, this.canvas.width, (this.canvas.height - (this.headerHeight + this.footerHeight + Ypadding)));
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, YPoint, this.canvas.width, (this.canvas.height - (this.headerHeight + this.footerHeight + Ypadding)));

        // Get the font for the name
        let fontName = (realpxPerMep*0.75);
        this.ctx.font = 'bold '+fontName.toFixed(2)+'px '+this.fontCanvas;
        let xWidth = ((realColumnWidth)-(logoWidth+logoToTextPadding+realpxPerMep))*0.97;
        for(let j=0;data.length>j;j++) {
            let name = data[j].Name;
            name = name.toUpperCase();
            name = name.split(' ');
            let lastName = name.pop();
            let firstLetter = name[0].charAt(0);
            let shortName = firstLetter + '.' + lastName;
            this.ctx.font = 'bold '+fontName.toFixed(2)+'px '+this.fontCanvas;
            if(this.ctx.measureText(shortName).width > xWidth){
                // Search for the optimal font size
                var textWidth = this.ctx.measureText(shortName).width;
                while (textWidth > xWidth) {
                    fontName = fontName*0.99;
                    this.ctx.font = "bold "+fontName.toFixed(2) + "px "+this.fontCanvas;
                    textWidth = this.ctx.measureText(shortName).width;
                }
            }
        }
        for(let i = 0; data.length > i; i++){
            if(mepCount == mepsPerColumn) {
                    // Change to a different column
                XPoint += columnWidth;
                YPoint = Ypadding+this.headerHeight;

                    // Reset mepCount
                mepCount = 0;
            }
            mepCount += 1;
                    // Draw the rectangle
                this.ctx.clearRect(XPoint, YPoint, realColumnWidth, realpxPerMep);
                this.ctx.fillStyle = '#d9d5d4';
                this.ctx.fillRect(XPoint, YPoint, realColumnWidth, realpxPerMep);

                // Draw the logo
                const url = new URL('api/logo?party='+data[i].NationalParty+'&width='+Math.floor((logoWidth*100)/100)+'&height='+Math.floor((realpxPerMep*100)/100), window.location.origin);
                await this.drawLogo(url, [XPoint, YPoint, logoWidth, realpxPerMep]);

                // Vote
                // Get relative coordinates and width of circle
                let r = realpxPerMep/2;
                let x = XPoint + realColumnWidth - r;
                let y = YPoint + realpxPerMep/2
                if(data[i].Vote == 'Against') {
                    this.drawCircle(r,x,y,"AGAINST");
                }
                if(data[i].Vote == 'For') {
                    this.drawCircle(r,x,y,"FOR");
                }
                if(data[i].Vote == 'Abstention') {
                    this.drawCircle(r,x,y,"ABSTENTION");
                }
                if(data[i].Vote == 'Absent') {
                    this.drawCircle(r,x,y,"ABSENT");
                }
                    // Name
                let name = data[i].Name;
                name = name.toUpperCase();
                name = name.split(' ');
                let lastName = name.pop();
                let firstLetter = name[0].charAt(0);
                let shortName = firstLetter + '.' + lastName;

                this.ctx.fillStyle = 'black';
                this.ctx.textAlign = 'left';
                this.ctx.font = "bold "+fontName+ 'px '+ this.fontCanvas
                this.ctx.fillText(shortName, (XPoint+logoWidth+logoToTextPadding), y+(fontName*0.33));

                    // Update x and Y values
                YPoint += pxPerMep;
            }
      }

    writeOutcome(outcome, language) {
        // Write outcome
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        let outcomeFont = (15*this.canvas.height)/335;
        this.ctx.font = "bold "+ outcomeFont + 'px ' +this.fontCanvas;
        this.ctx.fillText(language.OUTCOME, (this.canvas.width*0.88), (this.canvas.height*0.91));

        // Get the Y starting position
        let YText = (323*this.canvas.height)/335;
        let YCircle = (319*this.canvas.height)/335;

        // Calculate total length to get x starting point
        this.ctx.font = "bold "+ ((12*this.canvas.height)/335)+ 'px '+ this.fontCanvas;
        let textWidth = this.ctx.measureText(outcome['FOR']).width + this.ctx.measureText(outcome['AGAINST']).width + this.ctx.measureText(outcome['ABSTENTION']).width;
        let postCircleMargin = ((7*this.canvas.width)/600);
        let postTextMargin = ((3*this.canvas.width)/600);
        let spaceWidth = 3*postTextMargin + 2*postCircleMargin;
        let circleWidth = 3*((14*this.canvas.height)/335);
        let totalWidth = textWidth + spaceWidth + circleWidth;
        let XStart = ((this.canvas.width*0.88))-(totalWidth/2);

        // Transform data in outcome
        // Write the figure: in favour
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'left';
        this.ctx.font = "bold "+ ((12*this.canvas.height)/335)+ 'px '+ this.fontCanvas
        this.ctx.fillText(outcome['FOR'], XStart, YText);
        // Update XStart for circle + set up r and circle padding
        let r = ((7*this.canvas.width)/600);
        let circlePadding= ((3*this.canvas.width)/600);
        XStart += postTextMargin + r + this.ctx.measureText(outcome['FOR']).width;
        this.drawCircle(r, XStart, YCircle, 'FOR');

        // Refresh XStart value
        XStart += r + postCircleMargin;
        // Write the figure: AGAINST
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'left';
        this.ctx.font = "bold "+ ((12*this.canvas.height)/335)+ 'px '+ this.fontCanvas
        this.ctx.fillText(outcome['AGAINST'], XStart, YText);
        // Update XStart value
        XStart += postTextMargin + r + this.ctx.measureText(outcome['AGAINST']).width;
        // Draw the circle: AGAINST
        this.drawCircle(r, XStart, YCircle, 'AGAINST');

        // Refresh XStart value
        XStart += r + postCircleMargin;
        // Write the figure: ABSTENTION
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'left';
        this.ctx.font = "bold "+ ((12*this.canvas.height)/335)+ 'px '+ this.fontCanvas
        this.ctx.fillText(outcome['ABSTENTION'], XStart, YText);
        // Update XStart value
        XStart += postTextMargin + r + this.ctx.measureText(outcome['ABSTENTION']).width;
        // Draw the circle: ABSTENTION
        this.drawCircle(r, XStart, YCircle, 'ABSTENTION');
    }

    writeVote(text, language) {
        this.footerBlue(language);
        // Write the vote title
        // Set up ctx
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'left';
        this.ctx.font = ((7*this.canvas.height)/335)+"px "+this.fontCanvas;
        // Several lines system
        if(this.ctx.measureText(text).width>((430*this.canvas.width)/600)){
            // Split the text
            let splitText = text.split(' ');
            // Fill as much words as possible in a 320 line, put them in lines array
            let lines = [];
            let placeLine = '';
            for(let j = 0; splitText.length>j; j++) {
                // Fake line allows comparison without adding the el to the real line
                let fakeLine = placeLine;
                if(j == 0) {
                    fakeLine += splitText[j];
                } else {
                    fakeLine += ' ' + splitText[j];
                }
                // Check if the text is more than a line
                if(this.ctx.measureText(fakeLine).width<((430*this.canvas.width)/600)) {
                    if(j == 0) {
                        placeLine += splitText[j];
                    } else {
                        placeLine += ' ' + splitText[j];
                    }
                } else {
                    lines.push(placeLine);
                    placeLine = splitText[j];
                }
                // Add the last line
                if(splitText.length - 1 == j) {
                    lines.push(placeLine);
                }
            }
            // Parse the lines array to create a line everytime
            // px is the starting point of the text vertically, we then add more px for every line
            let px = ((314*this.canvas.height)/335);
            for(let j = 0; lines.length>j; j++) {
                this.ctx.fillText(lines[j], ((10*this.canvas.width)/600), px);
                px += ((9*this.canvas.height)/335);
            }
        } else {
            // Display one line text
            this.ctx.fillText(text, ((10*this.canvas.width)/600), ((314*this.canvas.height)/335));
        }
    }

    checkLengthVoteChoice(text){
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'left';
        this.ctx.font = ((7*this.canvas.height)/335)+"px "+this.fontCanvas;
        // Several lines system
        if(this.ctx.measureText(text).width>((430*this.canvas.width)/600)){
            // Split the text
            let splitText = text.split(' ');
            // Fill as much words as possible in a 320 line, put them in lines array
            let lines = [];
            let placeLine = '';
            for(let j = 0; splitText.length>j; j++) {
                // Fake line allows comparison without adding the el to the real line
                let fakeLine = placeLine;
                if(j == 0) {
                    fakeLine += splitText[j];
                } else {
                    fakeLine += ' ' + splitText[j];
                }
                // Check if the text is more than a line
                if(this.ctx.measureText(fakeLine).width<((430*this.canvas.width)/600)) {
                    if(j == 0) {
                        placeLine += splitText[j];
                    } else {
                        placeLine += ' ' + splitText[j];
                    }
                } else {
                    lines.push(placeLine);
                    placeLine = splitText[j];
                }
                // Add the last line
                if(splitText.length - 1 == j) {
                    lines.push(placeLine);
                }
            }
            if(lines.length>3){
                return true;
            }
        } else {
                return false;
            }
    }

    async titleMana(text, logo){
        // Manage the logo if existing
        // Check if the logo is changing
        let realLogoWidth = 0;
        if(logo != "" && this.chosenLogo==logo){
            let logoHeight = this.headerHeight*0.80;
            let logoWidth = logoHeight*1.77;
            realLogoWidth = logoWidth+ this.canvas.width*0.05;
        }
        if(this.chosenLogo != logo){
            // If no logo, then its width is 0
            this.chosenLogo = logo;
            // Clear the area
            this.ctx.fillStyle = this.darkBlue;
            this.ctx.fillRect(this.canvas.width-(this.headerHeight*0.8*1.77+this.canvas.width*0.05),0, (this.headerHeight*0.8*1.77+this.canvas.width*0.05), this.headerHeight);
            if(logo != ""){
                // If a logo then draw it and assign width/height values
                let logoHeight = this.headerHeight*0.80;
                let logoWidth = logoHeight*1.77;
                realLogoWidth = logoWidth+ this.canvas.width*0.05;
                let XPoint = this.canvas.width - realLogoWidth+ this.canvas.width*0.025;
                let YPoint = this.headerHeight*0.10;
                const url = new URL('api/logo?party='+logo+'&width='+Math.floor((logoWidth*100)/100)+'&height='+Math.floor((logoHeight*100)/100), window.location.origin);
                await this.drawLogo(url, [XPoint, YPoint, logoWidth, logoHeight]);
            } else {
                this.headerBlue();
            }
        } else {
            // Only reset the text part
            this.ctx.clearRect(0, 0, this.canvas.width-(this.headerHeight*0.8*1.77+this.canvas.width*0.05), this.headerHeight);
            this.ctx.fillStyle = this.darkBlue;
            this.ctx.fillRect(0, 0, this.canvas.width-(this.headerHeight*0.8*1.77+this.canvas.width*0.05), this.headerHeight);
        }
        

        // Set up the context
        let font = Math.ceil((21*this.headerHeight)/60);
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.font = "bold "+font+'px '+this.fontCanvas;
        // Several lines system: one line is around 93% of the width
        if(this.ctx.measureText(text.toUpperCase()).width>(this.canvas.width*(1-0.05)-realLogoWidth)) {
            // Two lines solution
            this.ctx.font = "bold "+font*0.85+'px '+this.fontCanvas;
            if(this.ctx.measureText(text.toUpperCase()).width>(this.canvas.width*(1-0.05)-realLogoWidth)){
                // Split the text
                let splitText = text.split(' ');
                // Fill as much words as possible in a 320 line, put them in lines array
                let lines = [];
                let placeLine = '';
                for(let j = 0; splitText.length>j; j++) {
                    // Fake line allows comparison without adding the el to the real line
                    let fakeLine = placeLine;
                    if(j == 0) {
                        fakeLine += splitText[j];
                    } else {
                        fakeLine += ' ' + splitText[j];
                    }
                    // Check if the text is more than a line
                    if(this.ctx.measureText(fakeLine.toUpperCase()).width<(this.canvas.width*(1-0.05)-realLogoWidth)) {
                        if(j == 0) {
                            placeLine += splitText[j];
                        } else {
                            placeLine += ' ' + splitText[j];
                        }
                    } else {
                        lines.push(placeLine);
                        placeLine = splitText[j];
                    }
                    // Add the last line
                    if(splitText.length - 1 == j) {
                        lines.push(placeLine);
                    }
                }
                // Parse the lines array to create a line everytime
                // px is the starting point of the text vertically, we then add more px for every line
                let px = 2.4;
                for(let j = 0; lines.length>j; j++) {
                    this.ctx.fillText(lines[j].toUpperCase(), ((this.canvas.width-realLogoWidth)/2), this.headerHeight/px);
                    px = px/1.9;
                }
            } else {
                // One line solution with smaller text
                this.ctx.fillText(text.toUpperCase(), ((this.canvas.width-realLogoWidth)/2), (((this.headerHeight)/2)+(font/3)));
            }
            
        }
        // If only one line needed: center
        else {
            this.ctx.font = "bold "+font+'px '+this.fontCanvas;
            this.ctx.fillText(text.toUpperCase(), ((this.canvas.width-realLogoWidth)/2), (((this.headerHeight)/2)+(font/3)));
        }
    }

    drawVotesIndications(language) {
        // Basic positioning values
        let r = ((7*this.canvas.width)/600);
        let circlePadding= ((3*this.canvas.width)/600);
        this.ctx.font = "bold "+ ((12*this.canvas.height)/335)+ 'px '+ this.fontCanvas;
        let postCircleMargin = ((3*this.canvas.width)/600);
        let postTextMargin = ((7*this.canvas.width)/600);

        // Get the Y starting position
        let YText = ((300*this.canvas.height)/335);
        let YCircle = ((296*this.canvas.height)/335);
        // Get the XStart
        let XStart = ((5*this.canvas.width)/600);
        XStart += r;

        // IN FAVOUR
        this.drawCircle(r, XStart, YCircle, 'FOR');
        // Update XStart
        XStart += r + postCircleMargin;
        // Text in IN FAVOUR
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'left';
        this.ctx.font = "bold "+ ((12*this.canvas.height)/335)+ 'px '+ this.fontCanvas
        this.ctx.fillText(language.FOR, XStart, YText);

        // Update XStart
        XStart += r + postTextMargin + this.ctx.measureText(language.FOR).width;
        // AGAINST
        this.drawCircle(r, XStart, YCircle, 'AGAINST');
        // Update XStart
        XStart += r + postCircleMargin;
        // Text in AGAINST
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'left';
        this.ctx.font = "bold "+ ((12*this.canvas.height)/335)+ 'px '+ this.fontCanvas
        this.ctx.fillText(language.AGAINST, XStart, YText);

        // Update XStart
        XStart += r + postTextMargin + this.ctx.measureText(language.AGAINST).width;
        // ABSTENTION
        this.drawCircle(r, XStart, YCircle, 'ABSTENTION');
        // Update XStart
        XStart += r + postCircleMargin;
        // ABSTENTION text
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'left';
        this.ctx.font = "bold "+ ((12*this.canvas.height)/335)+ 'px '+ this.fontCanvas
        this.ctx.fillText(language.ABSTENTION, XStart, YText);

        // Update XStart
        XStart += r + postTextMargin + this.ctx.measureText(language.ABSTENTION).width;
        // ABSENT
        this.drawCircle(r, XStart, YCircle, 'ABSENT');
        // Update Xstart
        XStart += r + postCircleMargin;
        // ABSENT Text
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'left';
        this.ctx.font = "bold "+ ((12*this.canvas.height)/335)+ 'px '+ this.fontCanvas
        this.ctx.fillText(language.ABSENT, XStart, YText);

    }

    drawCircle(r, x, y, vote){
        if(vote == 'AGAINST') {
            // Draw the circle
            this.ctx.beginPath();
            this.ctx.arc(x,y,r, 0, Math.PI * 2);
            this.ctx.fillStyle = this.red;
            this.ctx.fill();
            // Get the slash: first part
            let coord = polarToCartesian(r*0.6, ((45 * Math.PI) / 180));
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x+coord['x'], y+coord['y']);
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 0.3*r;
            this.ctx.stroke();
            // Get the slash: second part
            let coord2 = polarToCartesian(r*0.6, ((225 * Math.PI) / 180));
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x+coord2['x'], y+coord2['y']);
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 0.3*r;
            this.ctx.stroke();
            // Get the slash: first part
            let cross = polarToCartesian(r*0.6, ((135 * Math.PI) / 180));
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x+cross['x'], y+cross['y']);
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 0.3*r;
            this.ctx.stroke();
            // Get the slash: second part
            let cross2 = polarToCartesian(r*0.6, ((315 * Math.PI) / 180));
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x+cross2['x'], y+cross2['y']);
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 0.3*r;
            this.ctx.stroke();
        }
        if(vote == 'FOR') {
            // Draw the circle
            this.ctx.beginPath();
            this.ctx.arc(x,y,r, 0, Math.PI * 2);
            this.ctx.fillStyle = this.green;
            this.ctx.fill();
            // Draw inside: +
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x+0.6*r, y);
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 0.3*r;
            this.ctx.stroke();
            // Left part
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x-0.6*r, y);
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 0.3*r;
            this.ctx.stroke();
            // Upper part
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x, y+r*0.6);
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 0.3*r;
            this.ctx.stroke();
            // Lower part
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x, y-r*0.6);
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 0.3*r;
            this.ctx.stroke();
        }
        if(vote == 'ABSTENTION') {
            // Draw the circle
            this.ctx.beginPath();
            this.ctx.arc(x,y,r, 0, Math.PI * 2);
            this.ctx.fillStyle = this.orange;
            this.ctx.fill();
            // Draw inside: -
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x+0.6*r, y);
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 0.3*r;
            this.ctx.stroke();
            // Left part
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x-0.6*r, y);
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 0.3*r;
            this.ctx.stroke();

        }
        if(vote == 'ABSENT') {
            // Draw the circle
            this.ctx.beginPath();
            this.ctx.arc(x,y,r, 0, Math.PI * 2);
            this.ctx.fillStyle = this.grey;
            this.ctx.fill();
            // Get the slash: first part
            let coord = polarToCartesian(r*0.6, ((130 * Math.PI) / 180));
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x+coord['x'], y+coord['y']);
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 0.3*r;
            this.ctx.stroke();
            // Get the slash: second part
            let coord2 = polarToCartesian(r*0.6, ((310 * Math.PI) / 180));
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x+coord2['x'], y+coord2['y']);
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 0.3*r;
            this.ctx.stroke();
        }
    }


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

function truncateString(string){
    let text = string.trim();
    let maxLength = 150;
    if (text.length > maxLength) {
      const startLength = Math.ceil((maxLength - 3) / 2);
      const endLength = Math.floor((maxLength - 3) / 2);

      const truncatedText = text.slice(0, startLength) + '...' + text.slice(-endLength);

      return truncatedText
    } else {
      return text
    }
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

