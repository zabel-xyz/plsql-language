//
/* Copyright (c) 2012-2017 The ANTLR Project. All rights reserved.
 * Use of this file is governed by the BSD 3-clause license that
 * can be found in the LICENSE.txt file in the project root.
 */
//

function CaseInsensitiveInputStream(stream, upper) {
    this._stream = stream;
    this._case = upper ? String.prototype.toUpperCase : String.prototype.toLowerCase;
    return this;
}

Object.defineProperty(CaseInsensitiveInputStream.prototype, "index", {
	get : function() {
		return this._stream.index;
	}
});

Object.defineProperty(CaseInsensitiveInputStream.prototype, "size", {
	get : function() {
		return this._stream.size;
	}
});

CaseInsensitiveInputStream.prototype.LA = function (offset) {
    c = this._stream.LA(offset);
    if (c <= 0) {
        return c;
    }
    return this._case.call(String.fromCodePoint(c)).codePointAt(0);
};

CaseInsensitiveInputStream.prototype.reset = function() {
    return this._stream.reset();
};

CaseInsensitiveInputStream.prototype.consume = function() {
    return this._stream.consume();
};

CaseInsensitiveInputStream.prototype.LT = function(offset) {
    return this._stream.LT(offset);
};

CaseInsensitiveInputStream.prototype.mark = function() {
    return this._stream.mark();
};

CaseInsensitiveInputStream.prototype.release = function(marker) {
    return this._stream.release(marker);
};

CaseInsensitiveInputStream.prototype.seek = function(_index) {
    return this._stream.seek(_index);
};

CaseInsensitiveInputStream.prototype.getText = function(start, stop) {
    return this._stream.getText(start, stop);
};

CaseInsensitiveInputStream.prototype.toString = function() {
    return this._stream.toString();
};

exports.CaseInsensitiveInputStream = CaseInsensitiveInputStream;
