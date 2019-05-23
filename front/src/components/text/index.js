import React, { Component } from 'react'

class TextComponent extends Component {
    render() {
        return (
            <div style={{margin: "5%"}}>
              
                       <h1>Excess Waiting Time applied to the MIVB</h1>
                       <p style={{marginTop: "3%"}}>
                       Up until a few years ago the MIVB published performance data. Unfortunatly they recently stopped doing that. This project tries to shine a light
                       on the current performance of the MIVB by measuring the Excess Waiting Time. The EWT is the Average Waiting Time - Scheduled Waiting Time or in short EWT = AVT - SWT.
                       <br /></p>

                       <br />
                       <h3>Average Waiting Time</h3>
                       <br />
                       <p>
                       The average waiting time is the time that passengers effectively had to wait on average for a tram/bus/metro to arrive. The AWT does take into account the delay
                        It is measured by taking the average time bewteen two vehicles on a stop and dividing that by 2. This is done to account for people arriving at a random time at a certain stop. 
                       <br />
                       <br />
                       </p>
                       <h3>Scheduled Waiting Time</h3> 
                       <br />
                       <p>
                       The Scheduled Waiting Time is the time that passengers should have to wait on average for a tram/bus/metro to arrive. It is the average waiting time as Scheduled by the MIVB
                       </p>
                       <br />
                       <br />
                       <h3>Estimate Waiting Time</h3>
                       Finally once the AWT and the SWT have been measured the SWT can be substracted from the AWT and the result is the Excess Waiting Time. The excess waiting time is the amount of time a passenger has to wait more than scheduled. The closer to 0 the better.
            </div>
        )
    }
}
export default TextComponent;
