import React from 'react';
import Button from '@material-ui/core/Button';
import { List, ListItem, ListItemText } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import GeezKeyTrie from './GeezKeyTrie';
import Lessons from './json/Lessons';
import GeezKeyMap from './json/GeezKeyMap';

class LessonsList extends React.Component {
  render() {
    let listItems = [];
    for (let i = 0; i < this.props.numLessons; i++) {
      listItems.push((
        <ListItem className='typing-tutor-lessons-list-item' key={i} button onClick={() => {
          this.props.setupLesson(i)
        }}>
          <ListItemText key={i}><span style={{fontFamily: 'Noto Sans Ethiopic'}} >ደረጃ {i+1}</span></ListItemText>
        </ListItem>
      ));
    }

    return (
      <div>
        <List className="typing-tutor-lessons-list">
          {listItems}
        </List>
      </div>
    )
  }
}

export class TypingTutor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lesson_number: -1,
      lesson_languages: Lessons.languages,
      lesson_texts: Lessons.texts,
      
      show_help_text: true,

      words_per_minute: 0,
      accuracy: 100,
      typed_text: '',
      active: false,
      finished: false,
      start_time: 0,
      time_active: 0,
    }

    this.key_down_listener = (event) => this.handleKeyDown(event);

    this.geez_key_map = GeezKeyMap;
    this.reverse_geez_key_map = {};
    for (let key in this.geez_key_map) {
      if (this.geez_key_map[key] in this.reverse_geez_key_map) {
        this.reverse_geez_key_map[this.geez_key_map[key]].push(key);
      } else {
        this.reverse_geez_key_map[this.geez_key_map[key]] = [key];
      }
    }

    for (let key in this.reverse_geez_key_map) {
      this.reverse_geez_key_map[key] = this.reverse_geez_key_map[key].sort((a, b) => {
        return (a.length < b.length) ? -1 : 1;
      });
    }

    this.update_active = () => this.updateActive();

    this.typed_lines = 0;
    this.text_lines = [];
    this.text_joined_lines = [];
    this.text_length = 0;
    this.text_full = '';
    this.raw_line_text = [];
    this.current_line_index = 0;
    this.typed_lines = 0;
    this.num_words_list = [];

    this.geez_key_trie = new GeezKeyTrie(this.geez_key_map);
    this.resetGeez();
  }

  updateActive() {
    if (this.state.active) {
      this.setState({
        time_active: Math.round((Date.now() - this.state.start_time) / 1000)
      });
      this.recomputeWordsPerMinute();
    }
  }

  componentWillMount() {
    document.addEventListener('keydown', this.key_down_listener);
    this.update_active_id = setInterval(this.update_active, 1000);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.key_down_listener);
    clearInterval(this.update_time_active_id);
  }

  componentDidUpdate(prev_props, prev_state, snapshot) {
    if (this.state.lesson_number !== prev_state.lesson_number) {
      this.reset();
      this.text_lines = this.splitTextToLines();
      this.text_joined_lines = this.text_lines.map((l, index) => {
        let last_word = (l.length > 0) ? l[l.length-1] : '';
        if (last_word.length > 0 && last_word[last_word.length-1] === '¶') {
          return l.join(' ');
        } else if (index < this.text_lines.length-1) {
          return l.join(' ') + ' ';
        } else {
          return l.join(' ') + '¶';
        }
      });
      this.text_length = this.text_joined_lines.map((v) => v.length).reduce((p, c) => p + c, 0);
      this.text_full = this.text_joined_lines.join('');
      this.num_words_list = this.computeNumWords(this.text_joined_lines.join(''));
    }

    if (this.state.start_time !== prev_state.start_time ||
        this.state.typed_text.length !== prev_state.typed_text.length) {
      this.recomputeAccuracy();
      this.recomputeWordsPerMinute();
    }
  }

  computeNumWords(text) {
    let num_words_list = [];
    let num_words = 0;
    let active_word = false;
    for (let i = 0; i < text.length; i++) {
      let is_space = /[\s|¶]/.test(text[i]);
      if (!is_space && !active_word) {
        active_word = true;
      } else if (is_space && active_word) {
        active_word = false;
        num_words++;
      }
      num_words_list.push(num_words);
    }
    return num_words_list;
  }

  setupLesson(lessonNumber) {
    this.setState({lesson_number: lessonNumber});
  }

  resetActiveState() {
    this.setState({
      words_per_minute: 0,
      accuracy: 100,
      typed_text: '',
      active: false,
      finished: false,
      start_time: 0,
    });
    
    this.typed_lines = 0;
  }

  resetGeez() {
    this.geez_current_node = null;
    this.geez_parse_number = 0;
    this.geez_base_node = null;
    this.geez_tail_keys = '';
  }

  reset() {
    this.resetGeez();
    this.resetActiveState();
    if (this.typing_scroll_view) this.typing_scroll_view.scrollTo(0, 0);
  }

  scrollTypingView() {
    if (this.typing_scroll_view && this.state.active) {
      const line_height = 68.496;
      const view_height = this.typing_scroll_view.clientHeight;
      const mid_lines = Math.floor(view_height / line_height / 2);
      this.typing_scroll_view.scrollTo(0, line_height * Math.max(0, this.typed_lines-mid_lines));
    }
  }

  getText() {
    if (this.state.lesson_number >= 0 && this.state.lesson_number < this.state.lesson_texts.length) {
      return this.state.lesson_texts[this.state.lesson_number];
    }
  }

  getLanguage() {
    if (this.state.lesson_number >= 0 && this.state.lesson_number < this.state.lesson_languages.length) {
      return this.state.lesson_languages[this.state.lesson_number];
    }
  }

  splitTextToLines() {
    const chars_per_line = 40;
    let text = this.getText() || '';
    let words = text.replace(/\r/g, '\n').replace(
      /\n/g, '¶').split(/\s/);
    let words_update = [];
    for (let i = 0; i < words.length ; i++) {
      let word = words[i];
      let search_index = word.search('¶');
      while (search_index >= 0) {
        words_update.push(word.slice(0, search_index+1));
        word = word.slice(search_index+1);
        search_index = word.search('¶');
      }
      if (word.length > 0) words_update.push(word);
    }

    words = words_update;

    let lines = [];
    let line_char_count = 0;
    let current_line = [];
    for (let i = 0; i < words.length; i++) {
      let word = words[i];
      line_char_count += word.length + 1;

      if (word.length > 0 && word[word.length-1] === '¶') {
        current_line.push(word);
        lines.push(current_line);
        current_line = [];
        line_char_count = 0;
      } else if (line_char_count > chars_per_line) {
        lines.push(current_line);
        current_line = [word];
        line_char_count = word.length + 1;
      } else {
        current_line.push(word);
      }
    }

    if (current_line.length > 0) lines.push(current_line);
    return lines;
  }

  handleKeyDown(event) {
    if (event.keyCode === 32 && event.target === document.body) {
      event.preventDefault();
    }

    if (!this.state.finished && !this.state.active && this.isValidLesson()) {
      this.reset();
      this.setState({
        active: true,
        start_time: Date.now(),
      });
    }

    let lesson_language = this.getLanguage() || '';
    let key_event = event.key;
    if (key_event === 'Enter') key_event = '¶';
    if (this.state.active) {
      if (key_event.length === 1) {
        if (lesson_language === 'en') {
          // English
          let finished = this.state.finished;
          if (this.state.typed_text.length + 1 === this.text_length) finished = true;
          this.setState({
            typed_text: this.state.typed_text + key_event,
            finished: finished,
          });
        } else if (lesson_language === 'ge') {
          // Geez
          let geez_text = this.state.typed_text;
          if (this.geez_parse_number > 0) {
            if (this.geez_current_node.children.hasOwnProperty(key_event)) {
              this.geez_current_node = this.geez_current_node.children[key_event];
              if (this.geez_base_node) {
                this.geez_tail_keys += key_event;
              }

              this.geez_parse_number++;
            } else {
              if (this.geez_current_node.value) {
                geez_text += this.geez_current_node.value;
              } else if (this.geez_base_node) {
                let tail_value = this.geez_key_trie.lookup(this.geez_tail_keys);
                if (tail_value) {
                  geez_text += this.geez_base_node.value + tail_value;
                }
              }
    
              this.resetGeez();
            }
          }
    
          if (this.geez_parse_number === 0) {
            let root_exists = this.geez_key_trie.root.children.hasOwnProperty(key_event);
            if (root_exists) {
              this.geez_current_node = this.geez_key_trie.root.children[key_event];
              this.geez_parse_number++;
            } else if (/[\s|¶]/.test(key_event)) {
              geez_text += key_event;
            }
          }

          if (this.geez_current_node && this.geez_current_node.value) {
            this.geez_base_node = this.geez_current_node;
            this.geez_tail_keys = '';
          }

          let finished = this.state.finished;
          let active = this.state.active;
          if (geez_text.length === this.text_length) {
            finished = true;
            active = false;
          }

          this.setState({
            typed_text: geez_text,
            active: active,
            finished: finished,
          });
        }
      } else if (key_event === 'Backspace') {
        if (lesson_language === 'en') {
          // English
          this.setState({
            typed_text: this.state.typed_text.slice(0, this.state.typed_text.length-1)
          });
        } else if (lesson_language === 'ge') {
          // Geez
          if (this.geez_current_node) {
            if (this.geez_tail_keys.length > 0 && this.geez_base_node && this.geez_base_node.value) {
              this.setState({
                typed_text: this.state.typed_text + this.geez_base_node.value,
              })
            }
            this.resetGeez();
            this.forceUpdate();
          } else {
            this.setState({
              typed_text: this.state.typed_text.slice(0, this.state.typed_text.length-1)
            });
          }
        }
      }
      
      this.recomputeWordsPerMinute();
      this.recomputeAccuracy();
      this.scrollTypingView();
    }
  }

  recomputeWordsPerMinute() {
    let total_words = this.num_words_list[this.state.typed_text.length];
    let total_time_ms = Date.now() - this.state.start_time;
    let total_time_minutes = total_time_ms / 60000.0;
    let words_per_minute = 0;
    const min_typing_time = 1.0 / 60;
    if (total_time_minutes > min_typing_time && total_words > 0) words_per_minute = total_words / total_time_minutes;
    if (this.state.finished) words_per_minute = this.state.words_per_minute;
    this.setState({
      words_per_minute: words_per_minute,
    })
  }

  recomputeAccuracy() {
    let total_errors = 0;
    let text = this.text_full;
    let total_chars = Math.min(text.length, this.state.typed_text.length);
    for (let i = 0; i < total_chars; i++) {
      if (text[i] !== this.state.typed_text[i]) total_errors++;
    }

    let accuracy = 100.0;
    if (total_chars > 0) accuracy = (total_chars - total_errors) * 100 / total_chars;
    this.setState({
      accuracy: accuracy,
    });
  }

  isValidLesson(lesson_number) {
    if (!lesson_number) lesson_number = this.state.lesson_number;
    return lesson_number >= 0 && lesson_number < (
      Math.min(
        this.state.lesson_languages.length,
        this.state.lesson_texts.length));
  }

  stopLesson() {
    if (this.isValidLesson() && this.state.active) {
      this.setState({
        active: false,
        time_active: 0,
      })
    }
  }

  startLesson() {
    if (this.isValidLesson() && !this.state.active) {
      this.reset();
      this.setState({
        active: true,
        start_time: Date.now(),
      }); 
    }
  }

  nextLesson() {
    if (this.isValidLesson() &&
      this.isValidLesson(this.state.lesson_number+1) &&
      !this.state.active) {
      this.reset();
      this.setState({
        lesson_number: this.state.lesson_number+1,
      })
    }
  }

  renderTextView() {
    let line_views = [];
    let typed_chars = 0;

    let typed_text = this.state.typed_text;
    let lesson_language = this.getLanguage();
    if (lesson_language === 'ge') {
      if (this.geez_current_node && this.geez_current_node.value) {
        typed_text += this.geez_current_node.value;
      } else if (this.geez_base_node) {
        typed_text += this.geez_base_node.value;
        let next_value = this.geez_key_trie.lookup(this.geez_tail_keys);
        if (next_value) typed_text += next_value;
      }
    }

    // Build the line views for the original text and the typed text.
    let text_chars = 0;
    let current_line = 0;
    for (let i = 0; i < this.text_joined_lines.length; i++) {
      let full_line = this.text_joined_lines[i];
      if (text_chars <= typed_text.length && text_chars + full_line.length > typed_text.length) {
        let line_end = text_chars + full_line.length - typed_text.length;
        line_views.push((
          <div key={'text_' + i.toString()} className='typing-tutor-text-line'>
            {full_line.slice(0, full_line.length - line_end)}
            <span className='typing-tutor-underlined-char'>
              {full_line[full_line.length - line_end]}
            </span>
            {full_line.slice(full_line.length - line_end + 1, full_line.length)}
            <br />
          </div>));

        current_line = i;
        this.current_line_index = full_line.length - line_end;
      } else {
        line_views.push((
          <div key={'text_' + i.toString()} className='typing-tutor-text-line'>
            {full_line}<br />
          </div>));
      }

      text_chars += full_line.length;
      if (typed_chars < typed_text.length) {
        let typed_line = typed_text.slice(typed_chars, typed_chars + full_line.length);

        // Evaluate which characters are correct and incorrect.
        let typed_chars_view = [];
        for (let j = 0; j < typed_line.length; j++) {
          if (typed_line[j] === full_line[j]) {
            typed_chars_view.push((
              <span key={'typed_chars_' + j.toString()} className='typed-char-correct'>
                {typed_line[j]}
              </span>
            ));
          } else {
            typed_chars_view.push((
              <span key={'typed_chars_' + j.toString()} className='typed-char-incorrect'>
                {typed_line[j]}
              </span>
            ));
          }
        }


        line_views.push((
          <div key={'typed_' + i.toString()} className='typing-tutor-typed-line'>
            {typed_chars_view}<br />
          </div>
        ))
        typed_chars += full_line.length;

        this.typed_lines = i;
      } else {
        line_views.push((
          <div key={'typed_' + i.toString()} className='typing-tutor-typed-line'>
            <br />
          </div>
        ))
      }
    }

    if (this.text_joined_lines.length) {
      this.raw_line_text = this.computeRawLineText(this.text_joined_lines[current_line]);
    } else {
      this.raw_line_text = [];
    }

    return line_views;
  }

  computeRawLineText(s) {
    let first_letters = [];     // Assumes the first key of fidel input text is the same for all keycodes.
    for (let i = 0; i < s.length; i++) {
      if (s[i] in this.reverse_geez_key_map) {
        first_letters.push(this.reverse_geez_key_map[s[i]]);
      } else {
        first_letters.push(s[i]);
      }
    }

    let raw_line_text = [];
    for (let i = 0; i < s.length; i++) {
      if (s[i] in this.reverse_geez_key_map) {
        let keycodes = null;
        for (let j = 0; j < this.reverse_geez_key_map[s[i]].length; i++) {
          let code = this.reverse_geez_key_map[s[i]][j];
          let node = this.geez_key_trie.lookupNode(code);
          if (i === s.length-1 || !node.children || !node.children.hasOwnProperty(first_letters[i+1])) {
            keycodes = code;
            break;
          }
        }

        if (keycodes) {
          raw_line_text.push(keycodes);
        } else {
          console.error('Issue finding the keycodes for', s[i], 'for the raw line text');
          raw_line_text.push(s[i]);
        }
      } else {
        raw_line_text.push(s[i]);
      }
    }

    return raw_line_text;
  }
  
  headingStatus() {
    if (this.isValidLesson()) {
      return 'ደረጃ ' + (this.state.lesson_number+1).toString();
    }
    return 'ለመጀመር፣ ደረጃን ይምረጡ';
  }

  footerStatus() {
    if (this.state.active) {
      return (
        <span className='typing-tutor-footer-incomplete'>
          {this.state.time_active.toString() + ' ሰ'}
        </span>)
    } else {
      if (this.state.finished) {
        return (
          <span className='typing-tutor-footer-complete'>
            {this.state.time_active.toString() + ' ሰ'}
          </span>)
      } else {
        return 'አልተጀመረም'
      }
    }
  }

  render() {
    let wpm_string = 'ቃ.በ.ደ';
    if (this.getLanguage() === 'en') wpm_string = 'wpm';
    
    let text_view = null;
    if (!this.isValidLesson()) {
      text_view = (
        <span className='typing-tutor-nolines'>
          ሌላ ደረጃ ይምረጡ...
        </span>);
    } else {
      text_view = this.renderTextView();
    }
    
    let help_button = (
      <Button style={{fontFamily: 'Noto Sans Ethiopic', marginTop: 'auto'}} color='primary' variant='contained' onClick={() => this.setState({show_help_text: true})}>
        አሳይ
      </Button>
    );
    let raw_line_text_views = [];
    if (this.state.show_help_text) {
      for (let i = 0; i < this.raw_line_text.length; i++) {
        if (i === this.current_line_index) {
          raw_line_text_views.push((
            <span key={'help_text_' + i.toString()} className='typing-tutor-underlined-char'>{this.raw_line_text[i]}</span>
          ));
        } else {
          raw_line_text_views.push(
            this.raw_line_text[i]
          );
        }
      }

      help_button = (
        <Button style={{fontFamily: 'Noto Sans Ethiopic', marginTop: 'auto'}} color='primary' variant='contained' onClick={() => this.setState({show_help_text: false})}>
          ደብቅ
        </Button>
      );
    }

    return (
      <div className="typing-tutor">
        <Grid style={{paddingTop: '10px'}} container spacing={16}>
          <Grid item xs={1}></Grid>
          <Grid item xs={1}>
            <Button style={{fontFamily: 'Noto Sans Ethiopic'}} className='typing-tutor-menu-btn' size='large' variant='contained' onClick={this.props.goToMenu}>ተመለስ</Button>
          </Grid>
          <Grid item xs={1}></Grid>
          <Grid item xs={8}>
            <span className='typing-tutor-title'>የመተየቢያ ማሰልጠኛ፡ {this.headingStatus()}</span>
          </Grid>
        </Grid>
        <Grid container spacing={16}>
          <Grid item xs={2}>
            <div className='typing-tutor-lessons-list-container'>
              <LessonsList numLessons={this.state.lesson_texts.length} setupLesson={(i) => this.setupLesson(i)} />
            </div>
          </Grid>
          <Grid item xs={10}>
            <div ref={(div_element) => this.typing_scroll_view = div_element} className='typing-tutor-lesson'>
              {text_view}
            </div>
            <div className='typing-tutor-help'>
              <Grid style={{marginLeft: '10px', marginRight: '10px'}} container spacing={16}>
                <Grid item xs={10}>
                  {raw_line_text_views}
                </Grid>
                <Grid item xs={2}>
                  {help_button}
                </Grid>
              </Grid>
            </div>
          </Grid>
        </Grid>
        <Grid container spacing={16}>
          <Grid item xs={1}></Grid>
          <Grid item xs={2}>{this.footerStatus()}</Grid>
          <Grid item xs={3}>
            {this.state.words_per_minute.toFixed(2)} {wpm_string}
          </Grid>
          <Grid item xs={2}>
            {this.state.accuracy.toFixed(2)}%
          </Grid>
          <Grid item xs={1}>
            <Button style={{fontFamily: 'Noto Sans Ethiopic'}} color='secondary' variant='contained' onClick={() => this.startLesson()} className='typing-tutor-control-element'>ጀምር</Button>
          </Grid>
          <Grid item xs={1}>
            <Button style={{fontFamily: 'Noto Sans Ethiopic'}} variant='contained' onClick={() => this.stopLesson()} className='typing-tutor-control-element'>አቁም</Button>
          </Grid>
          <Grid item xs={1}>
            <Button style={{fontFamily: 'Noto Sans Ethiopic'}} variant='contained' onClick={() => this.nextLesson()} className='typing-tutor-control-element'>ቀጣይ</Button>
          </Grid>
        </Grid>
      </div>);
  }
}
