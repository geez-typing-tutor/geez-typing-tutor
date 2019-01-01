import React from 'react';
import {Menu} from './Menu'
import {TypingTutor} from './TypingTutor'
import {WikiTyper} from './WikiTyper'
import {TypingInstructions} from './TypingInstructions'

import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import green from '@material-ui/core/colors/green';
import lime from '@material-ui/core/colors/lime';

const theme = createMuiTheme({
  palette: {
    primary: lime,
    secondary: green,
  },
  typography: {
    useNextVariants: true,
  }
});

export class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      window: 'menu'
    };
  }

  renderMenu() {
    return <Menu goToWikiTyper={() => this.setState({window: 'wiki-typer'})}
      goToTypingTutor={() => this.setState({window: 'typing-tutor'})}
      goToTypingInstructions={() => this.setState({window: 'typing-instructions'})} />
  }

  renderWikiTyper() {
    return <WikiTyper goToMenu={() => this.setState({window: 'menu'})} />
  }

  renderTypingTutor() {
    return <TypingTutor goToMenu={() => this.setState({window: 'menu'})} />
  }

  renderTypingInstructions() {
    return <TypingInstructions goToMenu={() => this.setState({window: 'menu'})} />
  }
  
  renderWindow() {
    if (this.state.window === 'typing-tutor') {
      return this.renderTypingTutor();
    } else if (this.state.window === 'typing-instructions') {
      return this.renderTypingInstructions();
    } else if (this.state.window === 'wiki-typer') {
      return this.renderWikiTyper();
    } else {
      return this.renderMenu();
    }
  }

  render() {
    return (
      <MuiThemeProvider theme={theme}>
        {this.renderWindow()}
      </MuiThemeProvider>
    )
  }
}