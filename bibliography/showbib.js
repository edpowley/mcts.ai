function e(value)
{
	if (value)
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
		
		return value;
	}
	else
	{
		return '<span class="error">unknown</span>';
	}
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
	var ka = a.entryTags[key] || "";
	var kb = b.entryTags[key] || "";
	
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

function formatEntry(entry)
{
	var tags = entry.entryTags;
	
	var result = $("<li>").addClass("bibtex-" + entry.entryType);
	
	var authorDiv = $("<div>").addClass("authorlist");
	result.append(authorDiv);
	var authors = tags.author.split(" and ");
	for (var i=0; i<authors.length; i++)
	{
		if (i > 0)
		{
			if (i == authors.length - 1)
				authorDiv.append(" and ");
			else
				authorDiv.append(", ");
		}
		
		var authorName = authors[i].replace(/^(.*), (.*)$/, "$2 $1");
		authorDiv.append($("<a>")
			.addClass("author")
			.click(authors[i], authorClicked)
			.append(e(authorName)));
	}
	authorDiv.append(". ");
	
	var icon = $("<img>").addClass("icon")
		.attr("src", entry.entryType + ".png")
		.attr("alt", entry.entryType)
		.attr("title", entry.entryType);
	result.append(icon);
	
	var titleDiv = $("<div>").addClass("title").append(e(tags.title) + ". ");
	result.append(titleDiv);
	
	var detailsDiv = $("<div>").addClass("details");
	result.append(detailsDiv);
	
	switch (entry.entryType)
	{
	case "article":
		detailsDiv.append('<span class="journalname">' + e(tags.journal) + '</span>, ');
		if ("volume" in tags && "number" in tags)
			detailsDiv.append(tags.volume + "(" + tags.number + "):");
		else if ("volume" in tags)
			detailsDiv.append(tags.volume + ":");
		else if ("number" in tags)
			detailsDiv.append(tags.number + ":");
		
		detailsDiv.append(e(tags.pages) + ", " + e(tags.year) + ". ");
		break;
	
	case "inproceedings":
		detailsDiv.append('<span class="conferencename">' + e(tags.booktitle) + '</span>, ');
		detailsDiv.append(e(tags.pages) + ", " + e(tags.year) + ". ");
		break;
	
	case "book":
		detailsDiv.append(e(tags.publisher) + ", " + e(tags.year) + ". ");
		break;
	
	case "incollection":
		detailsDiv.append('In <span class="bookname">' + e(tags.booktitle) + '</span>, ');
		detailsDiv.append(e(tags.pages) + ", " + e(tags.year) + ". ");
		break;
	
	case "phdthesis":
		detailsDiv.append(e(tags.type) + ", " + e(tags.school) + ", " + e(tags.year) + ". ");
		break;
	
	case "techreport":
		detailsDiv.append("Technical report, " + e(tags.institution) + ", " + e(tags.year) + ". ");
		break;
	
	default:
		detailsDiv.append('<span class="error">' + entry.entryType + '</span>');
		break;
	}
	
	var linksList = $("<ul>").addClass("links");
	result.append(linksList);
	
	linksList.append($("<li>").append(
		$("<a>").append("BibTeX").addClass("bibtex")
			.click(function() { $(this).closest(".links").next("pre.bibtex").toggle("fast"); })
	));
	
	if ("url" in tags)
		linksList.append($("<li>").append(
			$("<a>").attr("href", tags.url).append("URL")
		));
	
	if ("doi" in tags)
		linksList.append($("<li>").append(
			$("<a>").attr("href", "http://dx.doi.org/" + tags.doi).append("DOI")
		));
	
	var scholarQuery = authors[0].split(", ")[0]; + ' "' + tags.title + '"';
	scholarQuery = encodeURIComponent(scholarQuery);
	linksList.append($("<li>").append(
		$("<a>").append("Google Scholar")
			.attr("href", "http://scholar.google.com/scholar?hl=en&q=" + scholarQuery)
	));
	
	//TODO
	/*result.append($("<pre>")
		.addClass("bibtex")
		.append(entry.bibtex)
		.hide()
	);*/
	
	return result;
}

function authorClicked(event)
{
	filterByAuthor(event.data);
}

function clearFilter()
{
	$("ul#toplinks li.clearfilter").remove();
	$("#bib li").show();
}

function filterByAuthor(author)
{
	clearFilter();
	
	$("#bib li").each(function()
	{
		var $this = $(this);
		var entry = $this.data("entry");
		if (entry)
		{
			if ($.inArray(author, entry.entryTags.author) == -1)
			{
				$this.hide();
			}
		}
	});
	
	$("ul#toplinks").append(
		$("<li>").addClass("clearfilter").append(
			$("<a>").click(clearFilter)
				.append("Showing papers by " + author.replace(/^(.*), (.*)$/, "$2 $1") + " (click to show all)")
		)
	);
}

function sortByAuthor()
{
	$("#bib").sortChildren(
		function(el)  { return $(el).data("entry"); },
		function(a,b) { return compareBibEntries(a.value, b.value, ["author", "-year", "title"]); });
}

function sortByYear()
{
	$("#bib").sortChildren(
		function(el)  { return $(el).data("entry"); },
		function(a,b) { return compareBibEntries(a.value, b.value, ["-year", "author", "title"]); });
}

function toggleIcons()
{
	$("img.icon").toggle();
	
	var t = $("#toggleIcons #showhidetext");
	if (t.text() == "Hide")
		t.text("Show");
	else
		t.text("Hide");
}

var bibEntries = [];

function showBib(filter)
{
	$.ajax({
		url: "bibliography.bib",
		dataType: "text",
		success: function(data, status, jqXHR)
		{
			bibEntries = bibtexParse.toJSON(data);
			console.log(bibEntries);
			
			//bibEntries = parseBib(data);
			
			var refCount = 0;
			for (var i=0; i<bibEntries.length; i++)
			{
				if (filter(bibEntries[i]))
				{
					var entryElement = formatEntry(bibEntries[i]);
					entryElement.data("entry", bibEntries[i]);
					$("#bib").append(entryElement);
					refCount++;
				}
			}
			
			$("div.loading").remove();
			
			$("span#refcount").text(refCount);
			sortByAuthor();
		}
	});
}
