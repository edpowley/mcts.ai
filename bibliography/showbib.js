function e(value)
{
	return value || '<span class="error">unknown</span>';
}

function formatEntry(entry)
{
	var result = $("<li>").addClass("bibtex-" + entry.bibtexType);
	
	var authorDiv = $("<div>").addClass("authorlist");
	result.append(authorDiv);
	for (var i=0; i<entry.author.length; i++)
	{
		if (i > 0)
		{
			if (i == entry.author.length - 1)
				authorDiv.append(" and ");
			else
				authorDiv.append(", ");
		}
		
		var authorName = entry.author[i].replace(/^(.*), (.*)$/, "$2 $1");
		authorDiv.append($("<a>")
			.addClass("author")
			.click(entry.author[i], authorClicked)
			.append(authorName));
	}
	authorDiv.append(". ");
	
	var icon = $("<img>").addClass("icon")
		.attr("src", entry.bibtexType + ".png")
		.attr("alt", entry.bibtexType)
		.attr("title", entry.bibtexType);
	result.append(icon);
	
	var titleDiv = $("<div>").addClass("title").append(entry.title + ". ");
	result.append(titleDiv);
	
	var detailsDiv = $("<div>").addClass("details");
	result.append(detailsDiv);
	
	switch (entry.bibtexType)
	{
	case "article":
		detailsDiv.append('<span class="journalname">' + e(entry.journal) + '</span>, ');
		if ("volume" in entry && "number" in entry)
			detailsDiv.append(entry.volume + "(" + entry.number + "):");
		else if ("volume" in entry)
			detailsDiv.append(entry.volume + ":");
		else if ("number" in entry)
			detailsDiv.append(entry.number + ":");
		
		detailsDiv.append(e(entry.pages) + ", " + e(entry.year) + ". ");
		break;
	
	case "inproceedings":
		detailsDiv.append('<span class="conferencename">' + e(entry.booktitle) + '</span>, ');
		detailsDiv.append(e(entry.pages) + ", " + e(entry.year) + ". ");
		break;
	
	case "book":
		detailsDiv.append(e(entry.publisher) + ", " + e(entry.year) + ". ");
		break;
	
	case "incollection":
		detailsDiv.append('In <span class="bookname">' + e(entry.booktitle) + '</span>, ');
		detailsDiv.append(e(entry.pages) + ", " + e(entry.year) + ". ");
		break;
	
	case "phdthesis":
		detailsDiv.append(e(entry.type) + ", " + e(entry.school) + ", " + e(entry.year) + ". ");
		break;
	
	case "techreport":
		detailsDiv.append("Technical report, " + e(entry.institution) + ", " + e(entry.year) + ". ");
		break;
	
	default:
		detailsDiv.append('<span class="error">' + entry.bibtexType + '</span>');
		break;
	}
	
	var linksList = $("<ul>").addClass("links");
	result.append(linksList);
	
	linksList.append($("<li>").append(
		$("<a>").append("BibTeX").addClass("bibtex")
			.click(function() { $(this).closest(".links").next("pre.bibtex").toggle("fast"); })
	));
	
	if ("url" in entry)
		linksList.append($("<li>").append(
			$("<a>").attr("href", entry.url).append("URL")
		));
	
	if ("doi" in entry)
		linksList.append($("<li>").append(
			$("<a>").attr("href", "http://dx.doi.org/" + entry.doi).append("DOI")
		));
	
	var scholarQuery = entry.firstAuthorSurname() + ' "' + entry.title + '"';
	scholarQuery = encodeURIComponent(scholarQuery);
	linksList.append($("<li>").append(
		$("<a>").append("Google Scholar")
			.attr("href", "http://scholar.google.com/scholar?hl=en&q=" + scholarQuery)
	));
	
	result.append($("<pre>")
		.addClass("bibtex")
		.append(entry.bibtex)
		.hide()
	);
	
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
			if ($.inArray(author, entry.author) == -1)
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
			bibEntries = parseBib(data);
			
			var refCount = 0;
			//var bibtexSrc = "";
			for (var i=0; i<bibEntries.length; i++)
			{
				if (filter(bibEntries[i]))
				{
					var entryElement = formatEntry(bibEntries[i]);
					entryElement.data("entry", bibEntries[i]);
					$("#bib").append(entryElement);
					//bibtexSrc += bibEntries[i].bibtex + "\n";
					refCount++;
				}
			}
			
			$("div.loading").remove();
			
			$("span#refcount").text(refCount);
			sortByAuthor();
			
			//$("pre#bibtexSrc").text(bibtexSrc);
		}
	});
}
