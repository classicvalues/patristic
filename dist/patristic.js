"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], function () {
      return root.patristic = factory();
    });
  } else if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.patristic = factory();
  }
})(typeof self !== 'undefined' ? self : void 0, function () {
  "use strict";
  /**
   * The SemVer version string of the patristic library
   * @type {String} A string specifying the current version of the Patristic Library.
   * If not given, the version of patristic you are using if less than or equal to 0.2.2.
   * @example
   * console.log(patristic.version);
   */

  var version = "0.2.7";
  /**
   * A class for representing branches in trees.
   * It's written predominantly for phylogenetic trees (hence the
   * [Newick parser](#parseNewick),
   * [neighbor-joining implementation](#parseMatrix), etc.), but could
   * conceivably be useful for representing other types of trees as well.
   * @param       {Object} data An object containing data you wish to assign to
   * this Branch object. In particular, intended to overwrite the default
   * attributes of a Branch, namely `id`, `parent`, `length`, and `children`.
   * @constructor
   */

  function Branch(data) {
    Object.assign(this, {
      id: '',
      parent: null,
      length: 0,
      children: []
    }, data);
  }
  /**
   * Adds a new child to this Branch
   * @param  {(Branch|Object)} data [description]
   * @return {Branch} The (possibly new) child Branch
   */


  Branch.prototype.addChild = function (data) {
    var c;

    if (data instanceof Branch) {
      c = data;
      c.parent = this;
    } else {
      if (!data) data = {};
      c = new Branch(Object.assign(data, {
        parent: this
      }));
    }

    this.children.push(c);
    return c;
  };
  /**
   * Adds a new parent to this Branch. This is a bit esoteric and generally not
   * recommended.
   * @param  {(Branch|Object)} data     A Branch object, or the data to attach to one
   * @param  {Array} siblings An array of Branches to be the children of the new parent branch (i.e. siblings of this Branch)
   * @return {Branch}          The Branch on which this was called
   */


  Branch.prototype.addParent = function (data, siblings) {
    var c;

    if (data instanceof Branch) {
      c = data;
    } else {
      if (!data) data = {};
      c = new Branch(Object.assign(data));
    }

    siblings.forEach(function (sib) {
      return sib.setParent(c);
    });
    c.children = [this].concat(siblings);
    this.parent = c;
    return this;
  };
  /**
   * Returns a clone of the Branch on which it is called. Note that this also
   * clones all descendants, rather than providing references to the existing
   * descendant Branches.
   * @return {Branch} A clone of the Branch on which it is called.
   */


  Branch.prototype.clone = function () {
    return patristic.parseJSON(this.toObject());
  };
  /**
   * Returns the depth of a given child, relative to the node on which it is
   * called.
   * @param  {(Branch|String)} descendant A descendant Branch (or `id` string thereof)
   * @return {Number} The sum of the all branches between the Branch on which it
   * is called and child. Return an error if `descendant` is not a descendant of
   * this Branch.
   */


  Branch.prototype.depthOf = function (descendant) {
    var distance = 0;
    if (typeof descendant === 'string') descendant = this.getDescendant(descendant);
    if (typeof descendant === 'undefined') throw Error('Cannot compute depth of undefined descendant!');
    var current = descendant;

    while (!current.isRoot()) {
      if (current === this) break;
      distance += current.length;
      current = current.parent;
    }

    return distance;
  };
  /**
   * Computes the patristic distance between `cousin` and the Branch on which
   * this method is called.
   * @param  {Branch} cousin The Branch to which you wish to compute distance
   * @return {number} The patristic distance between `cousin` and the branch on
   * this method is called.
   */


  Branch.prototype.distanceTo = function (cousin) {
    var mrca = this.getMRCA();
    return mrca.depthOf(this) + mrca.depthOf(cousin);
  };
  /**
   * Excises the Branch on which it is called and updates its parent and children
   * @return {Branch} The parent of the excised Branch.
   */


  Branch.prototype.excise = function () {
    var _this = this;

    if (this.isRoot() && this.children.length > 1) {
      throw new Error('Cannot excise a root node with multiple children.');
    }

    this.children.forEach(function (child) {
      child.length += _this.length;
      child.parent = _this.parent;
      if (!_this.isRoot()) _this.parent.children.push(child);
    });
    this.parent.children.splice(this.parent.children.indexOf(this), 1);
    return this.parent;
  };
  /**
   * Repairs incorrect links by recurively confirming that children reference
   * their parents, and correcting those references if they do not.
   * If you need to call this, something has messed up the state of your tree
   * and you should be concerned about that. Just FYI. ¯\_(ツ)_/¯
   * @param  {Boolean} nonrecursive Should this just fix the children of the
   * node on which it is called, or all descendants?
   * @return {Branch} The Branch on which it was called.
   */


  Branch.prototype.fixParenthood = function (nonrecursive) {
    var _this2 = this;

    this.children.forEach(function (child) {
      if (!child.parent) child.parent = _this2;
      if (child.parent !== _this2) child.parent = _this2;

      if (!nonrecursive && child.children.length > 0) {
        child.fixParenthood();
      }
    });
    return this;
  };
  /**
   * Returns an Array of all the ancestors of a given Branch
   * @return {Array} Every Ancestor of the Branch on which it was called.
   */


  Branch.prototype.getAncestors = function () {
    var ancestors = [];
    var current = this;

    while (!current.isRoot()) {
      ancestors.push(current.parent);
      current = current.parent;
    }

    return ancestors;
  };
  /**
   * Given an id, returns the child with that id (or undefined if no such child
   * is present).
   * @param  {String} childID the id of the child to return.
   * @return {(Branch|undefined)} The desired child branch, or undefined if the
   * child doesn't exist.
   */


  Branch.prototype.getChild = function (childID) {
    if (!_typeof(childID) == 'string') throw Error('childID is not a String!');
    return this.children.find(function (c) {
      return c.id === childID;
    });
  };
  /**
   * Given an id string, returns the descendant Branch with that ID, or undefined if it doesn't exist.
   * @param  {String} id The id string of the Branch to find
   * @return {(Branch|undefined)}    The descendant Branch, or undefined if it doesn't exist
   */


  Branch.prototype.getDescendant = function (id) {
    var descendant;

    if (this.children) {
      for (var i = 0; i < this.children.length; i++) {
        var child = this.children[i];

        if (child.id === id) {
          descendant = child;
          break;
        }

        if (child.children) {
          descendant = child.getDescendant(id);
        }
      }
    }

    return descendant;
  };
  /**
   * Returns an array of all Branches which are descendants of this Branch
   * @param {falsy} [nonterminus] Is this not the node on which the user called
   * the function? This is used internally and should be ignored.
   * @return {Array} An array of all Branches descended from this Branch
   */


  Branch.prototype.getDescendants = function (nonterminus) {
    var descendants = nonterminus ? [this] : [];

    if (!this.isLeaf()) {
      this.children.forEach(function (child) {
        child.getDescendants(true).forEach(function (d) {
          return descendants.push(d);
        });
      });
    }

    return descendants;
  };
  /**
   * alias of getLeaves
   * @type {Function}
   */


  Branch.prototype.getLeafs = Branch.prototype.getLeaves;
  /**
   * Returns an array of all leaves which are descendants of this Branch
   * @return {Array} An array of all leaves descended from this Branch
   */

  Branch.prototype.getLeaves = function () {
    if (this.isLeaf()) {
      return [this];
    } else {
      var descendants = [];
      this.children.forEach(function (child) {
        child.getLeaves().forEach(function (d) {
          return descendants.push(d);
        });
      });
      return descendants;
    }

    throw new Error("Something very weird happened. Sorry about that!");
  };
  /**
   * Traverses the tree upward until it finds the Most Recent Common Ancestor
   * (i.e. the first Branch for which both the Branch on which it was called and
   * `cousin` are descendants).
   * @return {Branch} The Most Recent Common Ancestor of both the Branch on
   * which it was called and the `cousin`.
   */


  Branch.prototype.getMRCA = function (cousin) {
    var mrca = this;

    while (!mrca.hasDescendant(cousin)) {
      if (mrca.isRoot()) throw Error('Branch and cousin do not appear to share a common ancestor!');
      mrca = mrca.parent;
    }

    return mrca;
  };
  /**
   * Traverses the tree upward until it finds the root node, and returns the
   * root.
   * @return {Branch} The root node of the tree
   */


  Branch.prototype.getRoot = function () {
    var node = this;

    while (!node.isRoot()) {
      node = node.parent;
    }

    return node;
  };
  /**
   * Determines if a given Branch (or ID) is a child of this Branch
   * @param  {(Branch|String)} child The branch (or the id thereof) to check for
   * @return {Boolean}
   */


  Branch.prototype.hasChild = function (child) {
    if (child instanceof Branch) return this.children.includes(child);
    if (typeof child === 'string') return this.children.some(function (c) {
      return c.id === child;
    });
    throw Error("Unknown type of child (".concat(_typeof(child), ") passed to Branch.hasChild!"));
  };
  /**
   * Checks to see if `descendant` is a descendant of the Branch on which this
   * method is called.
   * @param  {(Branch|String)} descendant Either the descendant Branch or its'
   * `id`.
   * @return {Boolean} True if `descendant` is descended from the Branch from
   * which this is called, otherwise false.
   */


  Branch.prototype.hasDescendant = function (descendant) {
    var descendants = this.getDescendants();

    if (descendant instanceof Branch) {
      return descendants.some(function (d) {
        return d === descendant;
      });
    } else if (typeof descendant === 'string') {
      return descendants.some(function (d) {
        return d.id === descendant;
      });
    }

    throw Error('Unknown type of descendant passed to Branch.hasDescendant!');
  };
  /**
   * Checks to see if a Branch has a descendant leaf.
   * @return {Boolean} True if leaf is both a leaf and a descendant of the
   * Branch on which this method is called, False otherwise.
   */


  Branch.prototype.hasLeaf = function (leaf) {
    var leaves = this.getleaves();

    if (leaf instanceof Branch) {
      return leaves.some(function (d) {
        return d === leaf;
      });
    } else if (typeof leaf === 'string') {
      return leaves.some(function (d) {
        return d.id === leaf;
      });
    }

    throw Error('Unknown type of leaf passed to Branch.hasLeaf.');
  };
  /**
   * Swaps a child with its parent. This method is probably only useful as an
   * internal component of [Branch.reroot](#reroot).
   * @return {Branch} The branch object on which it was called.
   */


  Branch.prototype.invert = function () {
    var oldParent = this.parent;

    if (oldParent) {
      this.parent = oldParent.parent;
      this.children.push(oldParent);
      oldParent.parent = this;
      oldParent.children.splice(oldParent.children.indexOf(this), 1);
    }

    return this;
  };
  /**
   * Returns whether the node on which it is called is a child of a given parent
   * (or parent ID).
   * @param  {(Branch|String)} parent A Branch (or ID thereof) to test for
   * paternity of this node.
   * @return {Boolean} True is `parent` is the parent of this Branch, false
   * otherwise.
   */


  Branch.prototype.isChildOf = function (parent) {
    if (parent instanceof Branch) return this.parent === parent;
    if (typeof parent === 'string') return this.parent.id === parent;
    throw Error('Unknown parent type passed to Branch.isChildOf');
  };
  /**
   * Tests whether this and each descendant branch holds correct links to both
   * its parent and its children.
   * @return {Boolean} True if consistent, otherwise false
   */


  Branch.prototype.isConsistent = function () {
    var _this3 = this;

    if (!this.isRoot()) {
      if (!this.parent.children.includes(this)) return false;
    }

    if (!this.isLeaf()) {
      if (this.children.some(function (c) {
        return c.parent !== _this3;
      })) return false;
      return this.children.every(function (c) {
        return c.isConsistent();
      });
    }

    return true;
  };
  /**
   * Returns whether a given Branch is an ancestor of the Branch on which this
   * method is called. Uses recursive tree-climbing.
   * @param  {[type]} ancestor [description]
   * @return {[type]}          [description]
   */


  Branch.prototype.isDescendantOf = function (ancestor) {
    if (!ancestor || !this.parent) return false;
    if (this.parent === ancestor || this.parent.id === ancestor) return true;
    return this.parent.isDescendantOf(ancestor);
  };
  /**
   * Returns a boolean indicating if this Branch is a leaf (i.e. has no
   * children).
   * @return {Boolean} True is this Branch is a leaf, otherwise false.
   */


  Branch.prototype.isLeaf = function () {
    return this.children.length === 0;
  };
  /**
   * Returns a boolean indicating whether or not this Branch is olate.
   *
   * ...Just kidding!
   *
   * Isolates a Branch and its subtree (i.e. removes everything above it, making
   * it the root Branch). Similar to [Branch.remove](#remove), only it returns
   * the Branch on which it is called.
   * @return {Branch} The branch object on which it was called.
   */


  Branch.prototype.isolate = function () {
    var index = this.parent.children.indexOf(this);
    this.parent.children.splice(index, 1);
    this.setParent(null);
    return this;
  };
  /**
   * Returns a boolean indicating if this Branch is the root of a tree (i.e. has
   * no parents).
   * @return {Boolean} True if this Branch is the root, otherwise false.
   */


  Branch.prototype.isRoot = function () {
    return this.parent === null;
  };
  /**
   * Removes a Branch and its subtree from the tree. Similar to
   * [Branch.isolate](#isolate), only it returns the root Branch of the tree
   * from which this Branch is removed.
   * @return {Branch} The root of the remaining tree.
   */


  Branch.prototype.remove = function () {
    var root = this.getRoot();
    this.isolate();
    return root;
  };
  /**
   * Reroots a tree on this Branch. Use with caution, this returns the new root,
   * which should typically supplant the existing root branch object, but does
   * not replace that root automatically.
   * @example
   * tree = tree.children[0].children[0].reroot();
   * @return {Branch} The new root branch, which is either the Branch on which this was called or its parent
   */


  Branch.prototype.reroot = function () {
    if (this.isRoot()) return this;
    if (this.parent.isRoot() && this.isLeaf()) return this.parent;
    var newRoot = this.isLeaf() ? this.parent : this;
    var current = newRoot;
    var toInvert = [];

    while (!current.isRoot()) {
      toInvert.push(current);
      current = current.parent;
    }

    toInvert.reverse().forEach(function (c) {
      return c.invert();
    });
    return newRoot;
  };
  /**
   * Set the length of a Branch
   * @param  {number} length The new length to assign to the Branch
   * @return {Branch}       The Branch object on which this was called
   */


  Branch.prototype.setLength = function (length) {
    this.length = length;
    return this;
  };
  /**
   * Sets the parent of the Branch on which it is called.
   * @param  {Branch} parent The Branch to set as parent
   * @return {Branch}        The Branch on which this method was called.
   */


  Branch.prototype.setParent = function (parent) {
    if (parent instanceof Branch || parent === null) {
      this.parent = parent;
      return this;
    }

    throw Error('Cannot set parent to non-Branch object!');
  };
  /**
   * toJSON is an alias for [toObject](#toObject), enabling the safe use of
   * `JSON.stringify` on Branch objects (in spite of their circular references).
   * @type {Function}
   * @returns {Object} A serializable Object
   */


  Branch.prototype.toJSON = Branch.prototype.toObject;
  /**
   * Computes a matrix of all patristic distances between all leaves which are
   * descendants of the Branch on which this method is called.
   * @return {Object} An Object containing a matrix (an Array of Arrays) and
   * Array of `id`s corresponding to the rows (and columns) of the matrix.
   */

  Branch.prototype.toMatrix = function () {
    var descendants = this.getLeaves();
    var n = descendants.length;
    var matrix = new Array(n);

    for (var i = 0; i < n; i++) {
      matrix[i] = new Array(n);
      matrix[i][i] = 0;

      for (var j = 0; j < i; j++) {
        var distance = descendants[i].distanceTo(descendants[j]);
        matrix[i][j] = distance;
        matrix[j][i] = distance;
      }
    }

    return {
      'matrix': matrix,
      'ids': descendants.map(function (d) {
        return d.id;
      })
    };
  };
  /**
   * Returns the Newick representation of this Branch and its descendants.
   * @param  {Boolean} [nonterminus=falsy] Is this not the terminus of the
   * Newick Tree? This should be falsy when called by a user (i.e. you). It's
   * used internally to decide whether or not in include a semicolon in the
   * returned string.
   * @return {String} The [Newick](https://en.wikipedia.org/wiki/Newick_format)
   * representation of the Branch.
   */


  Branch.prototype.toNewick = function (nonterminus) {
    var out = '';

    if (this.isLeaf()) {
      out += '(' + this.children.map(function (child) {
        return child.toNewick(true);
      }).join(',') + ')';
    }

    out += this.id;
    if (this.length) out += ':' + numberToString(this.length);
    if (!nonterminus) out += ';';
    return out;
  }; //This function takes a number and returns a string representation that does
  //not use Scientific Notation.
  //It's adapted from [StackOverflow](https://stackoverflow.com/a/46545519/521121),
  //Which makes it available under the [CC BY-SA 3.0 License](https://creativecommons.org/licenses/by-sa/3.0/)


  function numberToString(num) {
    var numStr = String(num);

    if (Math.abs(num) < 1.0) {
      var e = parseInt(num.toString().split('e-')[1]);

      if (e) {
        var negative = num < 0;
        if (negative) num *= -1;
        num *= Math.pow(10, e - 1);
        numStr = '0.' + new Array(e).join('0') + num.toString().substring(2);
        if (negative) numStr = "-" + numStr;
      }
    } else {
      var _e = parseInt(num.toString().split('+')[1]);

      if (_e > 20) {
        _e -= 20;
        num /= Math.pow(10, _e);
        numStr = num.toString() + new Array(_e + 1).join('0');
      }
    }

    return numStr;
  }
  /**
   * Returns a simple Javascript object version of this Branch and its
   * descendants. This is useful in cases where you want to serialize the tree
   * (e.g. `JSON.stringify(tree)`) but can't because the tree contains circular
   * references (for simplicity, elegance, and performance reasons, each branch
   * tracks both its children and its parent).
   * @return {Object} A serializable bare Javascript Object representing this
   * branch and its descendants.
   */


  Branch.prototype.toObject = function () {
    var output = {
      id: this.id,
      length: this.length
    };
    if (this.children.length > 0) output.children = this.children.map(function (c) {
      return c.toObject();
    });
    return output;
  };
  /**
   * Parses a hierarchical JSON string (or Object) as a Branch object.
   * @param  {(String|Object)} json A json string (or Javascript Object)
   * representing hierarchical data.
   * @param  {String} [idLabel=id]     The key used in the objects of `json` to
   * indicate their identifiers.
   * @param  {String} [lengthLabel=length] The key used in the objects of `json`
   * to indicate their length.
   * @param  {String} [childrenLabel=children] The key used in the objects of
   * `json` to indicate their children.
   * @return {Branch}               The Branch representing the root of the
   * hierarchy represented by the input JSON
   */


  function parseJSON(json, idLabel, lengthLabel, childrenLabel) {
    if (!idLabel) idLabel = 'id';
    if (!lengthLabel) lengthLabel = 'length';
    if (!childrenLabel) childrenLabel = 'children';
    if (typeof json === 'string') json = JSON.parse(json);
    var root = new Branch({
      id: json[idLabel],
      length: json[lengthLabel]
    });

    if (json[childrenLabel] instanceof Array) {
      json[childrenLabel].forEach(function (child) {
        root.addChild(patristic.parseJSON(child));
      });
    }

    return root;
  }
  /**
   * Parses a matrix of distances and returns the root Branch of the output tree.
   * This is adapted from Maciej Korzepa's [neighbor-joining](https://github.com/biosustain/neighbor-joining),
   * which is released for modification under the [MIT License](https://opensource.org/licenses/MIT).
   * @param  {Array} matrix An array of `n` arrays of length `n`
   * @param  {Array} labels An array of `n` strings, each corresponding to the values in matrix
   * @return {Branch} A Branch object representing the root node of the tree inferred by neighbor joining on matrix
   */


  function parseMatrix(matrix, labels) {
    var that = {};
    var N = that.N = matrix.length;
    if (!labels) labels = _toConsumableArray(Array(N).keys());
    that.cN = that.N;
    that.D = matrix;
    that.labels = labels;
    that.labelToTaxon = {};
    that.currIndexToLabel = new Array(N);
    that.rowChange = new Array(N);
    that.newRow = new Array(N);
    that.labelToNode = new Array(2 * N);
    that.nextIndex = N;
    that.I = new Array(that.N);
    that.S = new Array(that.N);

    for (var i = 0; i < that.N; i++) {
      var sortedRow = sortWithIndices(that.D[i], i, true);
      that.S[i] = sortedRow;
      that.I[i] = sortedRow.sortIndices;
    }

    that.removedIndices = new Set();
    that.indicesLeft = new Set();

    for (var _i = 0; _i < N; _i++) {
      that.currIndexToLabel[_i] = _i;
      that.indicesLeft.add(_i);
    }

    that.rowSumMax = 0;
    that.PNewick = "";
    var minI, minJ, d1, d2, l1, l2, node1, node2, node3;

    function setUpNode(labelIndex, distance) {
      var node;

      if (labelIndex < that.N) {
        node = new Branch({
          id: that.labels[labelIndex],
          length: distance
        });
        that.labelToNode[labelIndex] = node;
      } else {
        node = that.labelToNode[labelIndex];
        node.setLength(distance);
      }

      return node;
    }

    that.rowSums = sumRows(that.D);

    for (var _i2 = 0; _i2 < that.cN; _i2++) {
      if (that.rowSums[_i2] > that.rowSumMax) that.rowSumMax = that.rowSums[_i2];
    }

    while (that.cN > 2) {
      //if (that.cN % 100 == 0 ) console.log(that.cN);
      var _search = search(that);

      minI = _search.minI;
      minJ = _search.minJ;
      d1 = 0.5 * that.D[minI][minJ] + (that.rowSums[minI] - that.rowSums[minJ]) / (2 * that.cN - 4);
      d2 = that.D[minI][minJ] - d1;
      l1 = that.currIndexToLabel[minI];
      l2 = that.currIndexToLabel[minJ];
      node1 = setUpNode(l1, d1);
      node2 = setUpNode(l2, d2);
      node3 = new Branch({
        children: [node1, node2]
      });
      recalculateDistanceMatrix(that, minI, minJ);
      var sorted = sortWithIndices(that.D[minJ], minJ, true);
      that.S[minJ] = sorted;
      that.I[minJ] = sorted.sortIndices;
      that.S[minI] = that.I[minI] = [];
      that.cN--;
      that.labelToNode[that.nextIndex] = node3;
      that.currIndexToLabel[minI] = -1;
      that.currIndexToLabel[minJ] = that.nextIndex++;
    }

    var left = that.indicesLeft.values();
    minI = left.next().value;
    minJ = left.next().value;
    l1 = that.currIndexToLabel[minI];
    l2 = that.currIndexToLabel[minJ];
    d1 = d2 = that.D[minI][minJ] / 2;
    node1 = setUpNode(l1, d1);
    node2 = setUpNode(l2, d2);
    var tree = new Branch({
      children: [node1, node2]
    });
    tree.fixParenthood();
    return tree;
  }

  function search(t) {
    var qMin = Infinity,
        D = t.D,
        cN = t.cN,
        n2 = cN - 2,
        S = t.S,
        I = t.I,
        rowSums = t.rowSums,
        removedColumns = t.removedIndices,
        uMax = t.rowSumMax,
        q,
        minI = -1,
        minJ = -1,
        c2; // initial guess for qMin

    for (var r = 0; r < t.N; r++) {
      if (removedColumns.has(r)) continue;
      c2 = I[r][0];
      if (removedColumns.has(c2)) continue;
      q = D[r][c2] * n2 - rowSums[r] - rowSums[c2];

      if (q < qMin) {
        qMin = q;
        minI = r;
        minJ = c2;
      }
    }

    for (var _r = 0; _r < t.N; _r++) {
      if (removedColumns.has(_r)) continue;

      for (var c = 0; c < S[_r].length; c++) {
        c2 = I[_r][c];
        if (removedColumns.has(c2)) continue;
        if (S[_r][c] * n2 - rowSums[_r] - uMax > qMin) break;
        q = D[_r][c2] * n2 - rowSums[_r] - rowSums[c2];

        if (q < qMin) {
          qMin = q;
          minI = _r;
          minJ = c2;
        }
      }
    }

    return {
      minI: minI,
      minJ: minJ
    };
  }

  function recalculateDistanceMatrix(t, joinedIndex1, joinedIndex2) {
    var D = t.D,
        n = D.length,
        sum = 0,
        aux,
        aux2,
        removedIndices = t.removedIndices,
        rowSums = t.rowSums,
        newRow = t.newRow,
        rowChange = t.rowChange,
        newMax = 0;
    removedIndices.add(joinedIndex1);

    for (var i = 0; i < n; i++) {
      if (removedIndices.has(i)) continue;
      aux = D[joinedIndex1][i] + D[joinedIndex2][i];
      aux2 = D[joinedIndex1][joinedIndex2];
      newRow[i] = 0.5 * (aux - aux2);
      sum += newRow[i];
      rowChange[i] = -0.5 * (aux + aux2);
    }

    for (var _i3 = 0; _i3 < n; _i3++) {
      D[joinedIndex1][_i3] = -1;
      D[_i3][joinedIndex1] = -1;
      if (removedIndices.has(_i3)) continue;
      D[joinedIndex2][_i3] = newRow[_i3];
      D[_i3][joinedIndex2] = newRow[_i3];
      rowSums[_i3] += rowChange[_i3];
      if (rowSums[_i3] > newMax) newMax = rowSums[_i3];
    }

    rowSums[joinedIndex1] = 0;
    rowSums[joinedIndex2] = sum;
    if (sum > newMax) newMax = sum;
    t.rowSumMax = newMax;
    t.indicesLeft.delete(joinedIndex1);
  }

  function sumRows(a) {
    var n = a.length,
        sums = new Array(n);

    for (var i = 0; i < n; i++) {
      var sum = 0;

      for (var j = 0; j < n; j++) {
        var v = parseFloat(a[i][j]);
        if (typeof v !== 'number') continue;
        sum += a[i][j];
      }

      sums[i] = sum;
    }

    return sums;
  }

  function sortWithIndices(toSort, skip) {
    if (typeof skip === 'undefined') skip = -1;
    var n = toSort.length;
    var indexCopy = new Array(n);
    var valueCopy = new Array(n);
    var i2 = 0;

    for (var i = 0; i < n; i++) {
      if (toSort[i] === -1 || i === skip) continue;
      indexCopy[i2] = i;
      valueCopy[i2++] = toSort[i];
    }

    indexCopy.length = i2;
    valueCopy.length = i2;
    indexCopy.sort(function (a, b) {
      return toSort[a] - toSort[b];
    });
    valueCopy.sortIndices = indexCopy;

    for (var j = 0; j < i2; j++) {
      valueCopy[j] = toSort[indexCopy[j]];
    }

    return valueCopy;
  }
  /**
    * Parses a Newick String and returns a Branch object representing the root
    * of the output Tree.
    * This is adapted Jason Davies' [newick.js](https://github.com/jasondavies/newick.js/blob/master/src/newick.js),
    * which is released for modification under [the MIT License](https://opensource.org/licenses/MIT).
    * @param  {string} newick A Newick String
    * @return {Branch}        A Branch representing the root of the output
    */


  function parseNewick(newick) {
    var ancestors = [],
        tree = new Branch(),
        tokens = newick.split(/\s*(;|\(|\)|,|:)\s*/),
        n = tokens.length;

    for (var t = 0; t < n; t++) {
      var token = tokens[t];
      var c = void 0;

      switch (token) {
        case "(":
          // new branchset
          c = tree.addChild();
          ancestors.push(tree);
          tree = c;
          break;

        case ",":
          // another branch
          c = ancestors[ancestors.length - 1].addChild();
          tree = c;
          break;

        case ")":
          // optional name next
          tree = ancestors.pop();
          break;

        case ":":
          // optional length next
          break;

        default:
          var x = tokens[t - 1];

          if (x == ')' || x == '(' || x == ',') {
            tree.id = token;
          } else if (x == ':') {
            tree.length = parseFloat(token);
          }

      }
    }

    return tree;
  }

  return {
    version: version,
    Branch: Branch,
    parseJSON: parseJSON,
    parseMatrix: parseMatrix,
    parseNewick: parseNewick
  };
});

