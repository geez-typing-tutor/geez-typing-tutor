

class TrieNode {
  constructor(value, children) {
    this.value = value || null;
    this.children = children || {};
  }
}


export default class GeezKeyTrie {
  constructor(key_map) {
    this.key_map = key_map;
    this.root = new TrieNode();
    this.buildTrie();
  }

  buildTrie() {
    for (let key in this.key_map) {
      this.insertNode(key, this.key_map[key]);
    }
  }

  insertNode(key, value) {
    let current_node = this.root;
    for (let i = 0; i < key.length; i++) {
      if (!current_node.children.hasOwnProperty(key[i])) {
        current_node.children[key[i]] = new TrieNode();
      }
      current_node = current_node.children[key[i]];
    }
    current_node.value = value;
  }

  lookupNode(key) {
    let current_node = this.root;
    for (let i = 0; i < key.length; i++) {
      if (current_node.children.hasOwnProperty(key[i])) {
        current_node = current_node.children[key[i]];
      } else {
        return null;
      }
    }

    if (current_node.value) return current_node.value
    return null;
  }

  lookup(key) {
    let node = this.lookupNode(key);
    if (node && node.value) return node.value
    return null;
  }
}
