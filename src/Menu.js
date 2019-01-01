import React from 'react';
import Button from '@material-ui/core/Button';
import handPlacement from './images/hand-placement.png'

export class Menu extends React.Component {

  startTypingLessons() {

  }

  startWikiTyper() {

  }

  render() {
    return (
      <div className="menu">
        <h1 className="menu-title">የግዕዝ መተየቢያ ማሰልጠኛ</h1>
        <div className="menu-btns">
          <Button style={{fontFamily: 'Noto Sans Ethiopic'}} onClick={this.props.goToTypingTutor} variant="contained" color="primary" size="large">የስልጠና ደረጃዎች</Button><br /><br />
          <Button style={{fontFamily: 'Noto Sans Ethiopic'}} onClick={this.props.goToTypingInstructions} variant="contained" color="primary" size="large">መምሪያ</Button><br /><br />
          <img className='typing-tutor-hand-placement' src={handPlacement} alt='hand-placement' />
        </div>
      </div>
    );
  }
}