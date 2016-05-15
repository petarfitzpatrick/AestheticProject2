(function () {
    'use strict';
    var c = document.getElementById("myCanvas"),
        ctx = c.getContext("2d"),
        refresh = document.querySelector("#refresh"),
        c_x,
        c_y,
        decayVal = document.getElementById("decaySelect").value,
        attackVal = document.getElementById("attackSelect").value,
        delayVal = document.getElementById("delaySelect").value,
        animFrame = document.getElementById("animationSpeed").value,
        sineChoice = document.getElementById("sine"),
        squareChoice = document.getElementById("square"),
        sawtoothChoice = document.getElementById("sawtooth"),
        triangleChoice = document.getElementById("triangle"),
        waveformMode = document.getElementById("waveformMode").checked,
        oscType = "sawtooth",
        grid,
        permaGrid,
        soundGrid,
        rowMax,
        colMax,
        aud,
        note;
    
    function doMouseDown(event) {
        c_x = event.pageX;
        c_y = event.pageY;
    }
    
    //Function to read off mouse values
    c.addEventListener("mousedown", doMouseDown, false);

    //Func to change oscType var
    function changeOsc() {
        oscType = this.value;
    }
    sineChoice.onclick = changeOsc;
    squareChoice.onclick = changeOsc;
    sawtoothChoice.onclick = changeOsc;
    triangleChoice.onclick = changeOsc;

    //Grid is what it's all based on
    grid = [];
    //permaGrid to hold 7
    permaGrid = [];
    //soundGrid holds values for each sound
    soundGrid = [];

    //Currently 30 rows and columns. Can be changed
    rowMax = 30;
    colMax = 30;

    //Create audio context
    aud = new AudioContext();

    //note() function credit to Charlie
    note = function (freq, attack, decay, delayTime) {
        var osc = aud.createOscillator(),
            delay = aud.createDelay(2),
            oscVolume  = aud.createGain(),
            feedback   = aud.createGain();

        osc.type = oscType;
        osc.frequency.value = freq;
        feedback.gain.value = 0.5;
        delay.delayTime.value = delayTime; // measured in ms

        // create volume envelope for oscillator
        oscVolume.gain.setValueAtTime(0, aud.currentTime);
        oscVolume.gain.linearRampToValueAtTime(0.04, aud.currentTime + attack);
        oscVolume.gain.linearRampToValueAtTime(0, aud.currentTime + attack + decay);

        // connect oscillator to gain to control its volume
        osc.connect(oscVolume);

        // connect oscillator gain to output
        oscVolume.connect(aud.destination);

        // connect oscillator to delay
        oscVolume.connect(delay);

        // connect delay to feedback gain to control feedback amount
        delay.connect(feedback);

        // connect feedback control back into the delay to create loop
        feedback.connect(delay);

        // also connect delay to output
        delay.connect(aud.destination);

        // play a note immediately
        osc.start(aud.currentTime);

        // stop note after envelope is complete
        osc.stop(aud.currentTime + attack + decay);
    };

    //Create the grids
    for (var row = 0; row < rowMax; row++){
        grid[row] = [];
        permaGrid[row] = [];
        soundGrid[row] = [];
    }

    //Populates the two dimensional arrays
    function init(){
        //Nested for loops to populate
        for(var row = 0; row < rowMax; row++){
            for(var col = 0; col < colMax; col++){
                grid[row][col] = 0;
                permaGrid[row][col] = 0;
                soundGrid[row][col] = col*100;
            }
        }
        refresh.onclick = init;
    }

    //Begin program and loop it
    init();
    window.requestAnimationFrame(animate);

    //Plays repeatedly
    function animate() {
        setTimeout(function() {
          window.requestAnimationFrame(animate);
        }, animFrame);
            draw();
        update();
    }

    //Checks the mouse and fills in the respective node
    function checkMouse(){
        //Account for margins
        var newX, newY;
        //Using getBoundingClientRect in order to have values scale
        newX = c_x - c.getBoundingClientRect().left;
        newY = c_y - c.getBoundingClientRect().top;

        //New value to index col and row
        var colRef, rowRef;
        colRef = newX/30;
        rowRef = newY/30;

        if (newX > 0){
            //Math.floor is used to round numbers down
            if(grid[Math.floor(colRef)][Math.floor(rowRef)] == 0){       
                grid[Math.floor(colRef)][Math.floor(rowRef)] = 2;
            } else if(grid[Math.floor(colRef)][Math.floor(rowRef)] != 0){
                grid[Math.floor(colRef)][Math.floor(rowRef)] = 0;
                permaGrid[Math.floor(colRef)][Math.floor(rowRef)] = 0;
            }
        }

        //Clear them after
        c_x = 0;
        c_y = 0;
    }

    //Updates the grid every frame checking the rules and mouse clicks
    function update(){
        //Clear grids to begin
        var newGrid = [];
        for (var row = 0; row < rowMax; row++){
            newGrid[row] = [];
        }
        var nextGrid = [];
        for (var row = 0; row < rowMax; row++){
            nextGrid[row] = [];
        }

        for(var row = 0; row < rowMax; row++){
            for(var col = 0; col < colMax; col++){
                if (row <= 29){
                    //If this node were just clicked...
                    if (grid[row][col] == 2){
                         //Assign value to every surrounding node
                         //Check row to avoid null exception
                         if(row > 0){
                         nextGrid[row - 1][col] = 3;
                         }
                         nextGrid[row][col - 1] = 4;
                         if(row < 29){
                         nextGrid[row + 1][col] = 5;
                         }
                         nextGrid[row][col + 1] = 6;

                         //The permaGrid holds every red no matter what
                         permaGrid[row][col] = 7;
                         nextGrid[row][col] = permaGrid[row][col];

                         if (waveformMode){
                             //WAVEFORM MODE
                             if (row < 15 && col < 15){
                                 //Sine Zone
                                 oscType = "sine"
                             } else if (row >= 15 && col >= 15){
                                 //Square Zone
                                 oscType = "square"
                             } else if (row >= 15 && col < 15){
                                 //Sawtooth Zone
                                 oscType = "sawtooth"
                             } else if (row < 15 && col >= 15){
                                 //Triangular Zone
                                 oscType = "triangle"
                             }
                         }    

                         //Play the sound of that node!
                         note( soundGrid[row][col], parseFloat(attackVal), parseFloat(decayVal), parseFloat(delayVal));
                    //3 is the left movement value
                    } else if (grid[row][col] == 3){
                        if (row > 0){
                         //Activate next node
                         nextGrid[row - 1][col] = 3;
                         }
                         //Turn off current
                         nextGrid[row][col] = 0;
                    //4 is the top movement value
                    } else if (grid[row][col] == 4){
                         nextGrid[row][col - 1] = 4;
                         nextGrid[row][col] = 0;
                    //5 is the right movement value
                    } else if (grid[row][col] == 5){
                         if (row < 29){
                         nextGrid[row + 1][col] = 5;
                         }
                         nextGrid[row][col] = 0;
                    //6 is the bottom movement value
                    } else if (grid[row][col] == 6){
                         nextGrid[row][col + 1] = 6;
                         nextGrid[row][col] = 0;
                    }
                } 
            }
        }

        //Assign grid its nextGrid values!
        for(var row = 0; row < rowMax; row++){
            for(var col = 0; col < colMax; col++){
                if (nextGrid[row][col]){
                    grid[row][col] = nextGrid[row][col];
                } else {
                    grid[row][col] = 0;
                }
            }
        }

        //Keep permaGrid values
        for(var row = 0; row < rowMax; row++){
            for(var col = 0; col < colMax; col++){
                //This long if statement checks to see if a red node has been hit!
                if ((permaGrid[row][col] == 7 && grid[row][col] == 3) || (permaGrid[row][col] == 7 && grid[row][col] == 4) || (permaGrid[row][col] == 7 && grid[row][col] == 5) || (permaGrid[row][col] == 7 && grid[row][col] == 6)){
                    //It keeps the node as red
                    grid[row][col] = permaGrid[row][col];
                    //Then it fires off the surrounding nodes
                    if(row > 0){
                        grid[row - 1][col] = 3;
                    }
                    grid[row][col - 1] = 4;
                    if (row < 29){
                    grid[row + 1][col] = 5;
                    }
                    grid[row][col + 1] = 6;

                    if (waveformMode){
                        //WAVEFORM MODE
                        if (row < 15 && col < 15){
                            //Sine Zone
                            oscType = "sine"
                        } else if (row >= 15 && col >= 15){
                            //Square Zone
                            oscType = "square"
                        } else if (row >= 15 && col < 15){
                            //Sawtooth Zone
                            oscType = "sawtooth"
                        } else if (row < 15 && col >= 15){
                            //Triangular Zone
                            oscType = "triangle"
                        }
                    }


                    note( soundGrid[row][col], parseFloat(attackVal), parseFloat(decayVal), parseFloat(delayVal));
                }
                else if (permaGrid[row][col]){
                    //Or it just keeps it
                    grid[row][col] = permaGrid[row][col];
                }
            }
        }
        //Check if the user has activated another node
        checkMouse();

        //Update Values
        decayVal = document.getElementById("decaySelect").value;
        attackVal = document.getElementById("attackSelect").value;
        delayVal = document.getElementById("delaySelect").value;
        animFrame = document.getElementById("animationSpeed").value;
        waveformMode = document.getElementById("waveformMode").checked;
    }

    //Draws squares where the nodes are!
    function draw(){
        //Nested for loop for actually drawing
        for(var rows = 0; rows < rowMax; rows++){
            for(var cols = 0; cols < colMax; cols++){
                if (grid[rows][cols] == 0){
                    ctx.fillStyle = "#674172";

                    if (waveformMode){
                        //WAVEFORM MODE
                        if (rows < 15 && cols < 15){
                            //Sine Zone
                            ctx.fillStyle = "#2574A9";
                        } else if (rows >= 15 && cols >= 15){
                            //Square Zone
                            ctx.fillStyle = "#2574A9";
                        } else if (rows >= 15 && cols < 15){
                            //Sawtooth Zone
                            ctx.fillStyle = "#674172";
                        } else if (rows < 15 && cols >= 15){
                            //Triangular Zone
                            ctx.fillStyle = "#674172";
                        }
                    }

                } else if (grid[rows][cols] == 3 || grid[rows][cols] == 4 || grid[rows][cols] == 5 || grid[rows][cols] == 6){
                    ctx.fillStyle = "#6BB9F0";
                } else if (grid[rows][cols] == 2 || grid[rows][cols] == 7){
                    ctx.fillStyle = "#D2527F";
                }
                ctx.fillRect(rows * 30, cols * 30, 29, 29);
            }
        }
    }

})();