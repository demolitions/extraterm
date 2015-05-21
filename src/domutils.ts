/**
 * Convert an array-like object to a real array.
 * 
 * @param {Object} fakeArray An array-like object with get() and length support.
 * @return {Array} A real array object with the elements as fakeArray.
 */
export function toArray<T>(fakeArray: { [key: number]: T; length: number; }): T[] {
  var result: T[] = [];

  var len = fakeArray.length;
  for (var i=0; i<len; i++) {
    result.push(fakeArray[i]);
  }
  return result;
}

export interface LeftRightPair {
  left: Node[];
  right: Node[];
}

/**
 * Split child nodes at a character offset.
 * 
 * @param {Node} rootNode The node whose child nodes are to be split.
 * @param {number} charOffset The character offset to split at.
 * @return {Object} An object of the form {left: array, right: array}
 *     containing arrays of the child nodes left of, and right of the
 *     character offset.
 */
export function splitNodeContentsAtChar(rootNode: Node, charOffset: number): LeftRightPair {
  var newoffset: number;
  var newNode: Node;

  var kids = toArray(rootNode.childNodes);
  var len = kids.length;
  var offset = 0;
  if (charOffset === 0) {
    return {left: [], right: kids};
  }

  for (var i=0; i<len; i++) {
    var kid = kids[i];
    if (kid.nodeName === "#text") {
      newoffset = offset + kid.nodeValue.length;
      if (newoffset === charOffset) {
        return {left: kids.slice(0,i+1), right: kids.slice(i+1)};
      }
      if (newoffset > charOffset) {
        newNode = kid.ownerDocument.createTextNode(kid.nodeValue.slice(0, charOffset-offset));
        kid.nodeValue = kid.nodeValue.slice(charOffset-offset);
        rootNode.insertBefore(newNode, kid);
        return {left: kids.slice(0,i).concat(newNode), right: kids.slice(i)};
      }
    } else {

      // Assume a normal node.
      newoffset = offset + kid.textContent.length;
      if (newoffset === charOffset) {
        return {left: kids.slice(0,i+1), right: kids.slice(i+1)};
      }
      if (newoffset > charOffset) {
        var parts = splitNodeContentsAtChar(kid, charOffset-offset);
        newNode = kid.cloneNode(false);
        parts.left.forEach(function(node) {
          newNode.appendChild(node);
        });
        rootNode.insertBefore(newNode, kid);
        return {left: kids.slice(0,i).concat(newNode), right: kids.slice(i)};
      }
    }
    offset = newoffset;
  }

  return {left: kids, right: []};
}

export function encloseCharRange(rootNode: Node, startOffset: number, endOffset: number, newNode: Node) {
  var split1Results = splitNodeContentsAtChar(rootNode, startOffset);
  var nodeStartOffset = split1Results.left.length;    
  var split2Results = splitNodeContentsAtChar(rootNode, endOffset);
  var nodeEndOffset = split2Results.left.length;
  var kids = toArray(rootNode.childNodes).slice(nodeStartOffset, nodeEndOffset);

  kids.forEach(function(kid) {                 
    newNode.appendChild(kid);
  });

  insertNodeAt(rootNode, nodeStartOffset, newNode);
}

/**
 * Insert a node under a parent node at an offset.
 * 
 * @param {Node} rootNode
 * @param {number} offset
 * @param {Node} newNode
 */
export function insertNodeAt(rootNode: Node, offset: number, newNode: Node): void {
  if (offset >= rootNode.childNodes.length) {
    rootNode.appendChild(newNode);
  } else {
    rootNode.insertBefore(newNode, rootNode.childNodes[offset]);
  }
}
