// import

export default class DocFormater {

    public static format(doc: string, useJsDoc: boolean): string {
        if (!doc)
            return;

        if (useJsDoc)
            return this.formatToMarkdown(doc);
        else
            return this.formatToText(doc);
    }

    private static formatToText(doc: string): string {
        // remove /** */ and * at begin of line
        const regExpFormat = /\*\/|\/\*\*?|^[\t ]*\*[\t \/]?/gim;
        return doc.replace(regExpFormat, '').trim().replace(/^\s+$/gmi, '');
    }

    private static formatToMarkdown(doc: string): string {
        doc = this.formatToText(doc);

        const regExpFormat = /([\r\n])?(@param|@return|@\w+)[\t ]*:?[\t ]*({\w+})?[\t ]*(\w*)[\t ]*(\w*)/gi;
        return doc.replace(regExpFormat, (match, br, name, type, desc1, desc2) => {
            let result = `_${name}_ `;
            if (br)
                result = '\n\n'+result; //double \n to force new line
            if (type)
                result += ` **${type}**`;
            if (name === '@param') {
                if (desc1) // param name
                    result += ` \`${desc1}\``;
                if (desc2)
                    result += ` - ${desc2}`;
            } else {
                if (desc1)
                    result += ` - ${desc1}`;
                if (desc2)
                    result += ` ${desc2}`;
            }
            return result;
        });
    }
}
