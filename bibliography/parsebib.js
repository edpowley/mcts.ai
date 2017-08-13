

// BibEntry class
function BibEntry(type, key)
{
	this.bibtexType = type;
	this.bibtexKey = key;
}

BibEntry.prototype.hasKeyword = function(word)
{
	return "keywords" in this && this.keywords.indexOf(word) != -1;
}

BibEntry.prototype.isPpt = function()
{
	return this.title.indexOf("(PPT)") != -1;
}

BibEntry.prototype.firstAuthorSurname = function()
{
	return this.author[0].split(", ")[0];
}

function compareArrays(a, b)
{
	if (a.length == 0 && b.length == 0)
		return 0;
	else if (a.length == 0)
		return +1;
	else if (b.length == 0)
		return -1;
	
	if (a[0] == b[0])
		return compareArrays(a.slice(1), b.slice(1))
	else
		return (a[0].toUpperCase() > b[0].toUpperCase()) ? 1 : -1;
}

function compareBibEntries(a, b, keys)
{
	if (keys.length == 0)
		return 0;
	
	var key = keys[0];
	var descending = false;
	if (key[0] == '-')
	{
		key = key.substring(1);
		descending = true;
	}
	
	//console.log("Key: " + key);
	var ka = a[key] || "";
	var kb = b[key] || "";
	
	//console.log("Comparing:");
	//console.log(ka);
	//console.log(kb);
	
	if ($.isArray(ka))
	{
		var c = compareArrays(ka, kb);
		if (c == 0)
			return compareBibEntries(a, b, keys.slice(1));
		else
			return descending ? -c : c;
	}
	else
	{
		if (ka === kb)
			return compareBibEntries(a, b, keys.slice(1));
		else if (ka > kb)
			return descending ? -1 : +1;
		else
			return descending ? +1 : -1;
	}
}

// Parse an entry value: unescape characters, convert accented characters to HTML entities,
// split authors into a list, etc.
function parseValue(value, key)
{
	if (key == "url" || key == "doi")
	{
		value = value.replace(/\\&/g, "&");
		value = value.replace(/\\#/g, "#");
		value = value.replace(/\\_/g, "_");
	}
	else
	{
		value = value.replace(/\\&/g, "&amp;");
		value = value.replace(/---/g, "&mdash;");
		value = value.replace(/--/g, "&ndash;");
		
		// Convert accented characters
		//                                    vvvvvvvvvvvv   A letter, or a lower-case i without a dot
		value = value.replace(/\\([`'"^vc])\{([A-Za-z]|\\i)\}/g,
			function(s, accent, character) {
				if (character[0] == '\\') character = character[1]; // For the lower-case i without a dot
				switch (accent) {
					case '`': return "&" + character + "grave;";
					case "'": return "&" + character + "acute;";
					case '"': return "&" + character + "uml;";
					case '^': return "&" + character + "circ;";
					case 'v': return "&" + character + "caron;";
					case 'c': return "&" + character + "cedil;";
				}
			});
		
		value = value.replace(/\\alpha/g, "&alpha;");
		value = value.replace(/\\beta/g, "&beta;");
		value = value.replace(/\$/g, "");
		value = value.replace(/\{/g, "").replace(/\}/g, "");

		if (key == "author" || key == "editor")
		{
			value = value.split(" and ");
		}
	}
	
	return value;
}

function parseBib(text)
{
	var bib = [];
	var lines = text.split("\n");
	var currentEntry = null;
	
	// Regular expressions for .bib file lines
	// Entry start, e.g. "@article{Smith2014,"
	var reEntryStart = /^@([a-z]*)\{([-_A-Za-z0-9]*),$/
	
	// Key/value pair, e.g. "author = {Smith, John},"
	var reValue = /^([-_A-Za-z0-9]*)\s*=\s*\{(.*)\},?$/
	
	// Mendeley wraps all values in {braces} except for month
	var reMonthValue = /^(month)\s*=\s*([a-z]*),?$/
	
	// Entry always ends with "}" on a line by itself
	var reEntryEnd = /^}$/
	
	var ignoreKeys = ["abstract", "annote", "file", "keywords"];
	
	for (var i=0; i<lines.length; i++)
	{
		var lineNumber = i+1;
		var line = $.trim(lines[i]);
		var match;
		
		if (line == "")
		{
			// Do nothing
		}
		else if ( (match = reEntryStart.exec(line)) != null )
		{
			if (currentEntry != null)
				console.log("Current entry not closed on bib line " + lineNumber);
			
			currentEntry = new BibEntry(match[1], match[2]);
			currentEntry.bibtex = "@" + match[1] + "{" + match[2];
		}
		else if ( (match = reValue.exec(line)) != null || (match = reMonthValue.exec(line)) != null )
		{
			var key = match[1];
			var value = match[2];
			
			if (currentEntry == null)
				console.log("No current entry on bib line " + lineNumber);
			
			if (key in currentEntry)
				console.log("Duplicate key " + key + " on bib line " + lineNumber);
			
			if (key == "keywords")
				currentEntry.keywords = value;
			
			if ($.inArray(key, ignoreKeys) == -1)
			{
				currentEntry[key] = parseValue(value, key);
				currentEntry.bibtex += ",\n   " + key + " = {" + value + "}";
			}
		}
		else if ( (match = reEntryEnd.exec(line)) != null )
		{
			if (currentEntry == null)
				console.log("No current entry on bib line " + lineNumber);
			
			if (!("keywords" in currentEntry) || currentEntry.keywords.indexOf("000nonmcts") == -1)
				bib.push(currentEntry);
			
			currentEntry.bibtex += "\n}";
			currentEntry = null;
			
			//if (bib.length >= 20)
			//	break;
		}
		else
		{
			console.log("Syntax error on bib line " + lineNumber);
			console.log(line);
		}
	}
	
	return bib;
}

