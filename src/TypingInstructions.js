import React from 'react';
import Table from '@material-ui/core/Table'
import { TableBody, TableCell, TableRow, TableHead } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import GeezKeyMap from './json/GeezKeyMap';

export class TypingInstructions extends React.Component {
  render() {
    let character_conversion_rows = [];
    for (let key in GeezKeyMap) {
      character_conversion_rows.push((
        <TableRow key={key}>
          <TableCell component="th">
            <span className='typing-instructions-english'>
              {key}
            </span>
          </TableCell>
          <TableCell style={{fontFamily: 'Noto Sans Ethiopic'}}>{GeezKeyMap[key]}</TableCell>
        </TableRow>
      ))
    }

    return (
      <div className="typing-instructions">
        <Grid style={{paddingTop: '15px'}} container spacing={16}>
          <Grid item xs={1}></Grid>
          <Grid item xs={1}>
          <Button style={{fontFamily: 'Noto Sans Ethiopic'}} className='typing-instructions-menu-btn' size='large' variant='contained' onClick={this.props.goToMenu}>ተመለስ</Button>
          </Grid>
          <Grid item xs={1}></Grid>
          <Grid item xs={8}>
            <span className='typing-instructions-title'>የግዕዝ መተየቢያ ማሰልጠኛ መምሪያ</span>
          </Grid>
        </Grid>
        <div className="typing-instructions-overview">
          ይህ ድረ ገጽ (ዌይም ፍርግም) አማርኛ፣ ትግረኛ፣ ግዕዝና ሌሎች ቋንቋዎችን በደምብ እንዲተይቡ ይረዳል።
          ማሰልጠኛው ለመጠቀም የእንግሊዘኛ ቁልፍ ሰሌዳና የኢንተርኔት አሰሻ /ብራውዘር/
          (ለምሳሌ chromium) ብቻ ነው ሚያስፈልግዎት። ከየእንግሊዘኛ ቁልፎች ወደ የግዕዝ ፊደሎች
          የሚቀየሩት ቃላት እታች ይገኛሉ፥
          <br /><br />
        </div>
        <div className="typing-instructions-table">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>የእንግሊዘኛ ቃላት</TableCell>
                <TableCell>የግዕዝ ፊደል</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {character_conversion_rows}
            </TableBody>
            </Table>
        </div>
      </div>
    );
  }
}
