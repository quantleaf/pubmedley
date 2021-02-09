import { ConditionAnd, ConditionCompare, ConditionElement, ConditionNot, ConditionOr, Unknown } from '@quantleaf/query-result'
import { allFieldsKey, dateKeys,queryParamKeys,  GeneralSearch, allFieldsExactKey } from './advanced-search-schema'; // , Text, Images, News, Shopping 
import { translate, config, generateSchema } from '@quantleaf/query-sdk-node';
import { QueryResponse } from '@quantleaf/query-request';
import axios from 'axios';
import * as Papa from 'papaparse';
//Models
interface ReadableRepresentation 
{
    query:string, 
    errors:string[]
}
interface ParsedQuery {
    searchParams?: string;
    queryParams?: {
        key: string,
        value: string
    }[];
}
interface QuerySession {
    lastReadableQuery?: ReadableRepresentation,
    lastResponse?: QueryResponse;
    parsedQuery?: ParsedQuery,
    unparsedQuery?: string
}

interface QueryStatus {
    faults: string[],
    searchParamCounter:number;
    queryParamCounter:number;
}
// URL
const urlSearchPath = "/";
const maxSearchLength = 250;

// Settings
const debounceTime = 200; //ms
const api = 'https://api.query.quantleaf.com';
const apiKeySetupFunction = async () =>
{
    await fetch(api + '/auth/key/demo').then((resp) => resp.text().then((apiKey) => { config(apiKey); return apiKey })).catch(()=>{ serviceError = true; return null;});
}
var apiKeySetup = apiKeySetupFunction();

// State
var serviceError = false;
var sess: QuerySession = {}
//var lastRequestTime: number = new Date().getTime();
var lastSuggestions: string | undefined;
var limitedSuggestions: boolean = false;

var lastSearchField: HTMLInputElement | null | undefined = null;
var lastRestoredState: QuerySession;
var insertedLastUnparsedQuery = false;
var hasTypedAnything = false;
var load: Promise<any>;
var advancedSearchResultFocused = false;
var lastDefaultAutocompletOptionsFocused = false;
var ctrlDown = false;
var showAllSuggestions = false;

// UI (nasty since we are manipulating DOM and are not injecting html with iframes)
const focusedColor = '#e1f3f8';

const searchResultBoxShadow = 'inset 0px 7px 3px -5px rgb(50 50 50 / 16%)';
var advancedSearchResultContainer = document.createElement('li')
advancedSearchResultContainer.style.display = 'flex';
advancedSearchResultContainer.style.flexDirection = 'column'
advancedSearchResultContainer.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
advancedSearchResultContainer.style.width = '100%';
advancedSearchResultContainer.style.color = 'black';
advancedSearchResultContainer.style.padding = '15px';
advancedSearchResultContainer.style.backgroundColor = 'white';
advancedSearchResultContainer.style.position = 'relative';
advancedSearchResultContainer.style.zIndex = '101';
advancedSearchResultContainer.style.boxShadow = searchResultBoxShadow;
advancedSearchResultContainer.style.border = '1px solid rgba(0,0,0,0.15)'
advancedSearchResultContainer.style.borderTop = 'none'
advancedSearchResultContainer.style.cursor = 'pointer';

advancedSearchResultContainer.onmouseenter = () => 
{
    advancedSearchResultContainer.style.backgroundColor = focusedColor;
    advancedSearchResultFocused = true;
    updateAutoCompleteStyle();
}

advancedSearchResultContainer.onmouseleave = () => 
{
    advancedSearchResultContainer.style.backgroundColor = 'white';
    advancedSearchResultFocused = false;
    updateAutoCompleteStyle();

}

var header = document.createElement('div');
header.style.display = 'flex';
header.style.flexDirection = 'row'
header.style.width = '100%';
var title = document.createElement('span');
title.innerHTML = 'Advanced Search'
title.style.fontWeight = '600';

header.appendChild(title);

var loadingSpinner = document.createElement('div');
const spinner = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\r\n<svg xmlns=\"http:\/\/www.w3.org\/2000\/svg\" xmlns:xlink=\"http:\/\/www.w3.org\/1999\/xlink\" style=\"margin: auto; background: none; display: block; shape-rendering: auto;\" width=\"20px\" height=\"20px\" viewBox=\"0 0 100 100\" preserveAspectRatio=\"xMidYMid\">\r\n<g transform=\"rotate(0 50 50)\">\r\n  <rect x=\"47\" y=\"18\" rx=\"3\" ry=\"6\" width=\"6\" height=\"12\" fill=\"#000000\">\r\n    <animate attributeName=\"opacity\" values=\"1;0\" keyTimes=\"0;1\" dur=\"1s\" begin=\"-0.9166666666666666s\" repeatCount=\"indefinite\"><\/animate>\r\n  <\/rect>\r\n<\/g><g transform=\"rotate(30 50 50)\">\r\n  <rect x=\"47\" y=\"18\" rx=\"3\" ry=\"6\" width=\"6\" height=\"12\" fill=\"#000000\">\r\n    <animate attributeName=\"opacity\" values=\"1;0\" keyTimes=\"0;1\" dur=\"1s\" begin=\"-0.8333333333333334s\" repeatCount=\"indefinite\"><\/animate>\r\n  <\/rect>\r\n<\/g><g transform=\"rotate(60 50 50)\">\r\n  <rect x=\"47\" y=\"18\" rx=\"3\" ry=\"6\" width=\"6\" height=\"12\" fill=\"#000000\">\r\n    <animate attributeName=\"opacity\" values=\"1;0\" keyTimes=\"0;1\" dur=\"1s\" begin=\"-0.75s\" repeatCount=\"indefinite\"><\/animate>\r\n  <\/rect>\r\n<\/g><g transform=\"rotate(90 50 50)\">\r\n  <rect x=\"47\" y=\"18\" rx=\"3\" ry=\"6\" width=\"6\" height=\"12\" fill=\"#000000\">\r\n    <animate attributeName=\"opacity\" values=\"1;0\" keyTimes=\"0;1\" dur=\"1s\" begin=\"-0.6666666666666666s\" repeatCount=\"indefinite\"><\/animate>\r\n  <\/rect>\r\n<\/g><g transform=\"rotate(120 50 50)\">\r\n  <rect x=\"47\" y=\"18\" rx=\"3\" ry=\"6\" width=\"6\" height=\"12\" fill=\"#000000\">\r\n    <animate attributeName=\"opacity\" values=\"1;0\" keyTimes=\"0;1\" dur=\"1s\" begin=\"-0.5833333333333334s\" repeatCount=\"indefinite\"><\/animate>\r\n  <\/rect>\r\n<\/g><g transform=\"rotate(150 50 50)\">\r\n  <rect x=\"47\" y=\"18\" rx=\"3\" ry=\"6\" width=\"6\" height=\"12\" fill=\"#000000\">\r\n    <animate attributeName=\"opacity\" values=\"1;0\" keyTimes=\"0;1\" dur=\"1s\" begin=\"-0.5s\" repeatCount=\"indefinite\"><\/animate>\r\n  <\/rect>\r\n<\/g><g transform=\"rotate(180 50 50)\">\r\n  <rect x=\"47\" y=\"18\" rx=\"3\" ry=\"6\" width=\"6\" height=\"12\" fill=\"#000000\">\r\n    <animate attributeName=\"opacity\" values=\"1;0\" keyTimes=\"0;1\" dur=\"1s\" begin=\"-0.4166666666666667s\" repeatCount=\"indefinite\"><\/animate>\r\n  <\/rect>\r\n<\/g><g transform=\"rotate(210 50 50)\">\r\n  <rect x=\"47\" y=\"18\" rx=\"3\" ry=\"6\" width=\"6\" height=\"12\" fill=\"#000000\">\r\n    <animate attributeName=\"opacity\" values=\"1;0\" keyTimes=\"0;1\" dur=\"1s\" begin=\"-0.3333333333333333s\" repeatCount=\"indefinite\"><\/animate>\r\n  <\/rect>\r\n<\/g><g transform=\"rotate(240 50 50)\">\r\n  <rect x=\"47\" y=\"18\" rx=\"3\" ry=\"6\" width=\"6\" height=\"12\" fill=\"#000000\">\r\n    <animate attributeName=\"opacity\" values=\"1;0\" keyTimes=\"0;1\" dur=\"1s\" begin=\"-0.25s\" repeatCount=\"indefinite\"><\/animate>\r\n  <\/rect>\r\n<\/g><g transform=\"rotate(270 50 50)\">\r\n  <rect x=\"47\" y=\"18\" rx=\"3\" ry=\"6\" width=\"6\" height=\"12\" fill=\"#000000\">\r\n    <animate attributeName=\"opacity\" values=\"1;0\" keyTimes=\"0;1\" dur=\"1s\" begin=\"-0.16666666666666666s\" repeatCount=\"indefinite\"><\/animate>\r\n  <\/rect>\r\n<\/g><g transform=\"rotate(300 50 50)\">\r\n  <rect x=\"47\" y=\"18\" rx=\"3\" ry=\"6\" width=\"6\" height=\"12\" fill=\"#000000\">\r\n    <animate attributeName=\"opacity\" values=\"1;0\" keyTimes=\"0;1\" dur=\"1s\" begin=\"-0.08333333333333333s\" repeatCount=\"indefinite\"><\/animate>\r\n  <\/rect>\r\n<\/g><g transform=\"rotate(330 50 50)\">\r\n  <rect x=\"47\" y=\"18\" rx=\"3\" ry=\"6\" width=\"6\" height=\"12\" fill=\"#000000\">\r\n    <animate attributeName=\"opacity\" values=\"1;0\" keyTimes=\"0;1\" dur=\"1s\" begin=\"0s\" repeatCount=\"indefinite\"><\/animate>\r\n  <\/rect>\r\n<\/g>\r\n<\/svg>";
var loadingSpinnerSvg = document.createElement('div');
loadingSpinnerSvg.style.marginLeft = '4px';
loadingSpinnerSvg.style.marginRight = '4px';

loadingSpinnerSvg.style.marginTop = '2px';

loadingSpinnerSvg.innerHTML = spinner;
var loadingSpinnerText= document.createElement('span');
loadingSpinnerText.innerHTML = 'Loading'
loadingSpinnerText.style.fontStyle = 'italic';
loadingSpinnerText.style.fontSize = '10pt';
loadingSpinner.style.marginLeft = 'auto';
loadingSpinner.style.display = 'flex'
loadingSpinner.style.flexDirection = 'row'
loadingSpinner.style.alignItems  = 'center'
loadingSpinner.style.height = '20px';
loadingSpinner.style.marginRight = '-4px';
loadingSpinner.appendChild(loadingSpinnerText);
loadingSpinner.appendChild(loadingSpinnerSvg);


advancedSearchResultContainer.appendChild(header);


const showAllSuggestionsHTML = 'Show more';
const hideAllSuggetsionsHTML = 'Show less';

var suggestionViewToggle = document.createElement('span');
suggestionViewToggle.innerHTML = showAllSuggestionsHTML;;
suggestionViewToggle.style.cursor = "pointer";
suggestionViewToggle.style.border = '1px solid #aeb0b5';
suggestionViewToggle.style.padding = '2px';
suggestionViewToggle.style.fontSize = '7pt';
suggestionViewToggle.style.margin = '3px';
suggestionViewToggle.style.backgroundColor = 'white';
suggestionViewToggle.style.whiteSpace = 'pre'
suggestionViewToggle.onmouseenter = () => {
    advancedSearchResultContainer.style.backgroundColor = 'white';
    suggestionViewToggle.style.backgroundColor = focusedColor;

};

suggestionViewToggle.onmouseleave = () => {
    advancedSearchResultContainer.style.backgroundColor = focusedColor;
    suggestionViewToggle.style.backgroundColor = 'white';


};
suggestionViewToggle.onmousedown = (e) => {
    showAllSuggestions = !showAllSuggestions;
    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();
    printSuggestions();
}


var suggestionsContainer = document.createElement('span');
suggestionsContainer.innerHTML = ''
var suggestionsWrapper = document.createElement('div');
suggestionsWrapper.style.fontSize = '10pt';
suggestionsWrapper.style.minHeight = '60px'
suggestionsWrapper.appendChild(suggestionsContainer)
advancedSearchResultContainer.appendChild(suggestionsWrapper);

var textContainer = document.createElement('code');
advancedSearchResultContainer.appendChild(textContainer);
textContainer.style.whiteSpace = "pre-wrap";
textContainer.style.wordWrap = "break-word";
textContainer.style.paddingTop = "10px";
textContainer.style.paddingBottom = "10px";
//textContainer.style.fontWeight = "bold";

var footer = document.createElement('div');
footer.style.fontStyle = "italic";
footer.style.marginLeft = "auto";
footer.style.marginTop = "5px";
footer.style.lineHeight = "8pt";

footer.style.whiteSpace = "normal";
footer.style.fontSize = '10pt';
footer.style.color = "#70757a"
footer.style.display = 'flex';
footer.style.flexDirection = 'column';

var helpButton = document.createElement('span');
helpButton.innerHTML = 'Help <svg xmlns="http://www.w3.org/2000/svg" style="margin-bottom: -3px" width="16" height="16" viewBox="0 0 24 24" stroke-width="1.5" stroke="#70757a" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><circle cx="12" cy="12" r="9" /><line x1="12" y1="17" x2="12" y2="17.01" /><path d="M12 13.5a1.5 1.5 0 0 1 1 -1.5a2.6 2.6 0 1 0 -3 -4" /></svg>'
helpButton.style.marginLeft = "auto";
helpButton.style.marginBottom = "4px";
helpButton.style.cursor = "pointer";
helpButton.onmouseenter = () => {
    helpButton.style.textDecoration = 'underline'
};


helpButton.onmouseleave = () => {
    helpButton.style.textDecoration = ''
};
helpButton.onmousedown = (e) => {

    e.stopImmediatePropagation();
    e.preventDefault();
    chrome.runtime.sendMessage("__new_help_tab__");
}

var donationDiv = document.createElement('span')
donationDiv.innerHTML = 'Support us <svg xmlns="http://www.w3.org/2000/svg" style="margin-bottom: -3px" width="16" height="16" viewBox="0 0 24 24" stroke-width="1.5" stroke="#70757a" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19.5 13.572l-7.5 7.428l-7.5 -7.428m0 0a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" /></svg>'
donationDiv.style.marginLeft = "auto";
donationDiv.style.marginBottom = "4px";
donationDiv.style.cursor = "pointer";
donationDiv.style.borderRadius = "2px";

donationDiv.onmouseenter = () => {
    donationDiv.style.textDecoration = 'underline'
};


donationDiv.onmouseleave = () => {
    donationDiv.style.textDecoration = ''
};

donationDiv.onmousedown = (e) => {
    e.stopPropagation();
    e.stopImmediatePropagation();
    e.preventDefault();
    chrome.runtime.sendMessage("__new_donation_tab__");
};


footer.appendChild(helpButton);
footer.appendChild(donationDiv);
advancedSearchResultContainer.appendChild(footer);


// Export 
var exportButton =  document.createElement('button')
exportButton.innerHTML = 'Export'
exportButton.style.fontSize = '10pt';
exportButton.style.marginLeft = 'auto';
exportButton.onclick = async () => {
    const toolbar = getExportButtonToolbar();
    toolbar?.appendChild(loadingSpinnerSvg);
    const docs = document.querySelectorAll('div.docsum-wrap div.docsum-content')
    const csvRows = [
        ['Search text',lastSearchField?.value],
        ['Date', new Date().toISOString()],
        [],
        ['Title','Authors','Journal','Date','Abstract','Abstract link','Full text links']
    ];
    for (let i = 0; i < docs.length; i++) {
        const doc = docs[i];
        const aElement =  doc.querySelector('a');
        const title = aElement?.textContent as string;
        const abstractLink = aElement?.href as string;
        const authors =  doc.querySelector('span.full-authors')?.textContent as string;
        const journalCiteSpan = doc.querySelector('span.full-journal-citation');
        let journal =  doc.querySelector('span.full-journal-citation b')?.textContent as string;
        if(!journal)
            journal = journalCiteSpan?.textContent?.split('.')[0] as string;
        const fullCite = journalCiteSpan?.innerHTML;

        let date = fullCite?.split('</b>')[1]?.split(';')[0] as string;
        if(!date)
        {
            date = journalCiteSpan?.textContent?.substring(journal.length) as string;
            date = date?.split(';')[0] as string;
        }
        if(date)
        {
            if(date.startsWith('.'))
                date = date.substring(1);
            date = date.trim(); 
            date = date;
        }
        const loadedData = await axios.get(abstractLink).then((x)=>{
            var doc = new DOMParser().parseFromString(x.data as string, "text/html");
            const abstractElement =  doc.querySelector('main div.abstract-content');       
            const fullTextLinksA = doc.querySelectorAll('div.full-text-links-list a');
            const fullTextLinks:string[] = [];
            for (let i = 0; i < fullTextLinksA.length; i++) {
                fullTextLinks.push((fullTextLinksA[i] as HTMLLinkElement).href)
    
            }
            return {
                abstract: abstractElement?.textContent ? abstractElement?.textContent.replace(/(?: *[\n\r])+ */g, '\n').trim() : 'No abstract available',
                fullTextLinks:  [...new Set(fullTextLinks)]
            };
        
        })
        csvRows.push([title,authors,journal,date,loadedData.abstract,abstractLink,loadedData.fullTextLinks.join('\n')].map(x=>x?.trim()));

    }

    let csvContent = Papa.unparse(csvRows);
    var blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'})//{type: "data:text/csv;charset=utf-8"});
    var url = URL.createObjectURL(blob);
    chrome.runtime.sendMessage({
        url:url,
        fileName: `PubMed-results-${new Date().toISOString().split('T')[0]}.csv`
    });
   
    toolbar?.removeChild(loadingSpinnerSvg);



}


const setDynamicStyle = () => {
    // detect color mode light/dark

    const light = true;
    if(light)
    {
        advancedSearchResultContainer.style.borderBottom = 'border-bottom: 1px solid #e1e4e8'
        advancedSearchResultContainer.style.color = 'var(--color-auto-black);';//'rgb(106, 115, 125)'

    }

}

const loading = () =>
{
    unloading();
    header.appendChild(loadingSpinner);
}

const unloading = () =>
{
    try {
        header.removeChild(loadingSpinner);
    } catch (error) {
        // does not exist   
    }
}

// The search experience, code that define the translation to natural language to the generalized query structure
// and code that transform the generalized query structure into google query syntax

// The schema we want to search on
let schemaObjects = [new GeneralSearch()] // new Text(), new Images(), new News(), new Shopping()
schemaObjects = [schemaObjects[0]];
const schemas = schemaObjects.map(s => generateSchema(s));

// Map by key 
const fieldsByKey = {};
schemas.forEach((s) => {
    s.fields.forEach((f) => {
        fieldsByKey[f.key as string] = f;
    });
})


const  saveState = async()  => {
    return await new Promise((resolve) => {
        chrome.storage.sync.set({ lastQuerySession: sess }, () => {
            resolve(true);
        })
    });
}
const restoreLastSearchQuery = async() => {
    if (!lastSearchField)
        return;
    lastRestoredState = await new Promise((resolve) => {
        chrome.storage.sync.get('lastQuerySession', (data) => {
            resolve(data.lastQuerySession);
        });
    }) as QuerySession;
    if (!lastRestoredState && hasTypedAnything) {
        return;
    }
    sess = lastRestoredState && lastRestoredState.parsedQuery?.searchParams == lastSearchField?.value ? lastRestoredState : {};
    if (sess.parsedQuery?.searchParams == lastSearchField.value) {
        restoreSearchFieldText();
        const linkHolder = document.querySelector('body form div.search-links-wrapper');
        if(linkHolder)
        {
            const lh = linkHolder as HTMLElement;
            const lhWrapper = document.createElement('div');
            for (let i = 0; i < lh.children.length; i++) {
                const element = lh.children[i];
                lhWrapper.appendChild(element.cloneNode(true));

            }
            lh.innerHTML = '';
            lhWrapper.style.cssText  = String(lh.style);

            lh.appendChild(lhWrapper);

            lh.style.flexDirection = 'column'

            const lastSearchText = document.createElement('div');
            lastSearchText.innerHTML = 'You searched</br></br>' + sess.parsedQuery?.searchParams;
            lastSearchText.style.padding = '20px';
            lastSearchText.style.marginTop = '10px';
            lastSearchText.style.backgroundColor = 'white'
            lastSearchText.style.borderRadius = '10px';
            lastSearchText.style.fontFamily = 'monospace';
            lastSearchText.style.boxShadow = '1px 1px 4px 1px #00000036';
            lh.appendChild(lastSearchText);
           
        }

        getAndDrawResult(sess.unparsedQuery);

        
    }
    else {
        getAndDrawResult(lastSearchField.value);

    }

}

const debounce = <T extends (...args: any[]) => any>(
    callback: T,
    waitFor: number
  ) => {
    var timeout = null;
    return (...args: Parameters<T>): ReturnType<T> => {
      let result: any;
      clearTimeout(timeout as any as number);
      timeout = setTimeout(() => {
        result = callback(...args);
      }, waitFor) as any;
      return result;
    };
};

const restoreSearchFieldText = () => {
    if (!insertedLastUnparsedQuery && sess.unparsedQuery) {
        insertText(sess.unparsedQuery, true);
        insertedLastUnparsedQuery = true;
    }
}

const navigateSearch = async (useAdvancedSearch: boolean) => {

    if(sess.lastReadableQuery?.errors && sess.lastReadableQuery?.errors.length > 0)
    {
        alert('Query contains errors' + JSON.stringify(sess.lastReadableQuery?.errors));
        return;
    }
    
    if(useAdvancedSearch)
    {
        await load;

        try {
            if (sess.lastResponse?.query && sess.lastResponse.query[0]?.condition) {
                sess.parsedQuery = parseQueryResponse(sess.lastResponse.query[0].condition as (ConditionAnd | ConditionCompare));
                
                if(sess.parsedQuery?.searchParams)
                {
                    if(sess.parsedQuery.searchParams.startsWith('(') && sess.parsedQuery.searchParams.endsWith(')'))
                        sess.parsedQuery.searchParams = sess.parsedQuery.searchParams.substring(1,sess.parsedQuery.searchParams.length -1);
                }
            }    
            await saveState();
            if (sess.parsedQuery) // Only change value if we actually have parsed any query
            {
                
                // insertText(lastParsedQuery.searchParams, true);
                if (!sess.parsedQuery.searchParams)
                    alert('To perform an Advanced Search you need to provide at least one argument of text type, example: "contains apple"')
                else
                    navigateToQuery(sess.parsedQuery);
                return;
            }
        } catch (error) {
            alert(error.message);   
        }
        

    }
    
    // clean up url and tnavigate
    // reset url
    let newUrl = window.location.href;
    if (lastSearchField) {
        const urlObj = new URL(newUrl);

        // set query text
        urlObj.searchParams.set('term', lastSearchField.value);

        // There properties seems, or may cause problems
        if (urlObj.pathname != urlSearchPath) {
            urlObj.pathname = urlSearchPath;
        }
        newUrl = urlObj.toString();

    }

    if (lastRestoredState) {
        newUrl = decodeURI(newUrl);
        const urlParams = searchQueryParamsByKey(lastRestoredState.parsedQuery);
        const urlObj = new URL(newUrl);
        urlParams.forEach((param, key) => {
            const value = urlObj.searchParams.get(key);
            if (value == param || value == encodeURIComponent(param)) {
                urlObj.searchParams.delete(key);

            }
        });
        newUrl = urlObj.toString();

        while (newUrl.endsWith('&'))
            newUrl = newUrl.substring(0, newUrl.length - 1);

    }
    window.location.href = newUrl;

    

    return sess.parsedQuery;
}


/*
MutationObserver = window.MutationObserver;

var observer = new MutationObserver(function() {
    showSearchAutocomplete();
});

observer.observe(document, {
  subtree: true,
  attributes: true
});*/


// The Quantleaf Query API call
const getAndDrawResult = async (input: string = '') => {
    await apiKeySetup;

    const resp = input.length > maxSearchLength ? undefined :  await translate(input, schemaObjects, { query: {}, suggest: { limit: 300 } }, { nestedConditions: true, negativeConditions: true, concurrencySize: 1 })
    handleResponse(input, resp);
}

const calculateSuggestions = () => 
{
    limitedSuggestions = false;
    const suggestObjects = sess.lastResponse?.suggest;
    const limitSuggestions = showAllSuggestions && suggestObjects ? suggestObjects.length : 13
    let suggestions = suggestObjects?.map(s => s.text.trim()).slice(0, Math.min(suggestObjects.length, limitSuggestions)).join(', ');
    if(suggestObjects && suggestObjects?.length > limitSuggestions)
    {
        limitedSuggestions = true;
        suggestions += ', ...';

    }
    lastSuggestions = suggestions;
}


const noResults = 'No results';
// Injects advanced search UI as the first result element


const handleResponse = (input: string, responseBody?: QueryResponse) => {

    input as any;

    sess.lastResponse = responseBody;
    sess.parsedQuery = {}

    // Suggestions
    printSuggestions();

    if(input.length > maxSearchLength)
    {
        resultPrint({
            query: noResults,
            errors: ['Too long search. If you would like to to more advanced searches you can contact us from the "Help" page']
        })
        drawResults(true);
        return;
    }
    // Query
    else if (!responseBody || ((!responseBody.query || responseBody.query.length == 0) && ((!responseBody.suggest)))) {
        noResultsPrint();
        drawResults();
        return;
    }
  
    // Assume unknown serve a purpose
    if(sess.lastResponse && sess.lastResponse.unknown)
    {
        const unknownAsQuery = parseUnknownQuery(input, sess.lastResponse.unknown);

        // Merge in unknown query if applicable, we only check top level for now
        if (sess.lastResponse && sess.lastResponse.query && sess.lastResponse.query.length > 0 &&  unknownAsQuery) {
            if ((sess.lastResponse.query[0].condition as ConditionAnd).and) {
                const and = sess.lastResponse.query[0].condition as ConditionAnd;
                if (!and.and.find((x) => (x as ConditionCompare).compare?.key == allFieldsKey)) {
                    // Add the implicit query
                    and.and.push(unknownAsQuery);
                }
    
            }
            else if ((sess.lastResponse.query[0].condition as ConditionOr).or) {
                const or = sess.lastResponse.query[0].condition as ConditionOr;
                if (!or.or.find((x) => (x as ConditionCompare).compare?.key == allFieldsKey)) {
                    // Add the implicit query
                    or.or.push(unknownAsQuery);
                }
            }
            else if ((sess.lastResponse.query[0].condition as ConditionCompare).compare) {
                const comp = sess.lastResponse.query[0].condition as ConditionCompare;
                if (comp.compare.key != allFieldsKey) {
                    const mergedCondition: ConditionAnd = {
                        and: [
                            comp,
                            unknownAsQuery
                        ]
                    }
                    sess.lastResponse.query[0].condition = mergedCondition;
                }
            }
        }
    }
    

   
    // Readable
    sess.lastReadableQuery = sess.lastResponse ? parseReadableQuery(sess.lastResponse) : undefined;
    if (sess.lastReadableQuery)
        resultPrint(sess.lastReadableQuery)
    else
        noResultsPrint()
}
const resultPrint = (readable: ReadableRepresentation) => {
    textContainer.innerHTML = `<code>${readable.query}</code></br></br>${readable.errors.map((x)=> '<span style="color:red">' + x + '</span>').join('</br>')}`;
}


const noResultsPrint = () => {
    textContainer.innerHTML = noResults;

}
const getExportButtonToolbar = () => 
{
   return document.querySelector('div.results-amount-container')
}
var _advancedSearchAutoCompleteContainer:any = null;
const getAdvancedSearchAutoCompleteContainer = () =>
{
    if(!_advancedSearchAutoCompleteContainer)
    {
        _advancedSearchAutoCompleteContainer = document.createElement('div')
        _advancedSearchAutoCompleteContainer.style.left = '0px';
    }
    // Make sure it is last in the ist of the parent

    const lb = getDefaultAdvancedSearchAutoCompleteContainer();
    if(lb?.parentElement)
    {
        let index = -1;
        for (let i = 0; i < lb.parentElement.children.length; i++) {
            if(lb.parentElement.children[i] == _advancedSearchAutoCompleteContainer)
            {
                index = i;
            }
            
        }
        if(index != lb.parentElement.children.length -1)
        {
            if(index != -1)
            {
                lb.parentElement.removeChild(_advancedSearchAutoCompleteContainer);
            }
        }
        lb?.parentElement?.appendChild(_advancedSearchAutoCompleteContainer);

    }
    return _advancedSearchAutoCompleteContainer;
}



const updateAutoCompleteStyle = () => 
{
    const def = getDefaultAdvancedSearchAutoCompleteContainer();
    const hasDefaultResults = hasDefaultResultsToShow();
    if(def && def instanceof HTMLElement)
        def.style.boxShadow = searchResultBoxShadow;


    const container = getAdvancedSearchAutoCompleteContainer();
    let calcStyleHeight:string = '0px';
    let cStyle:any = null;
    if(def)
    {
        cStyle = window.getComputedStyle(def);
        if(cStyle.display != 'none')
            calcStyleHeight = cStyle.height;
    }
    advancedSearchResultContainer.style.boxShadow = hasDefaultResults ? 'none'  : searchResultBoxShadow;
    if(advancedSearchResultFocused)
    {
        advancedSearchResultContainer.style.backgroundColor = focusedColor;
    }
    else 
    {
        advancedSearchResultContainer.style.backgroundColor = 'white';
    }
    
    container.style.top = `calc(100% + ${calcStyleHeight})`; 
    container.style.right = cStyle?.right;
    container.style.position = "absolute" 
    

    
}

var _defaultAdvancedSearchAutoCompleteContainer;
const getDefaultAdvancedSearchAutoCompleteContainer = () =>
{
    if(_defaultAdvancedSearchAutoCompleteContainer)
        return _defaultAdvancedSearchAutoCompleteContainer;
    _defaultAdvancedSearchAutoCompleteContainer = document.querySelector('body form div[role="listbox"]');
    return _defaultAdvancedSearchAutoCompleteContainer;
}

const hasDefaultResultsToShow = ():boolean => 
{
    const el = getDefaultAdvancedSearchAutoCompleteList();
    if(!el)
        return false;
    return el.children?.length > 0;
}

const hasAdvancedResultsToShow = ():boolean => 
{
    if( !sess.parsedQuery || Object.keys(sess.parsedQuery as any).length == 0)
        return false;
    return true;
}

var _defaultAdvancedSearchAutoCompleteList;
const getDefaultAdvancedSearchAutoCompleteList = () =>
{
    if(_defaultAdvancedSearchAutoCompleteList)
        return _defaultAdvancedSearchAutoCompleteList;
    _defaultAdvancedSearchAutoCompleteList =  document.querySelector('main form div[role="presentation"]');
    return _defaultAdvancedSearchAutoCompleteList;
}

const drawResults = (force?:boolean) => {

    if(!hasAdvancedResultsToShow() && !lastSuggestions && !force)
    {
        ejectResult();
        return;
    }

    const listOutlet = getAdvancedSearchAutoCompleteContainer();
    if(listOutlet)
    {
        if (listOutlet.firstChild == advancedSearchResultContainer)
            listOutlet.removeChild(advancedSearchResultContainer);
        if(listOutlet.lastChild != advancedSearchResultContainer)
            listOutlet.appendChild(advancedSearchResultContainer);
    }
}
const ejectResult = () => 
{
 
    const listOutlet = getAdvancedSearchAutoCompleteContainer();
    
    if(listOutlet)
    {
        if (listOutlet.firstChild == advancedSearchResultContainer)
            listOutlet.removeChild(advancedSearchResultContainer);
    }

}
const insertText = (text?: string, clear?: boolean) => {
    if (lastSearchField) {
        (lastSearchField as HTMLInputElement).focus();
        if (clear)
            lastSearchField.value = '';
        document.execCommand('insertText', false, text);
        lastSearchField.dispatchEvent(new Event('change', { bubbles: true })); // usually not needed
    }

}

const searchFieldTextFromParsedQuery = (parsedQuery?: ParsedQuery) => {
    if (!parsedQuery)
        return undefined;
    return  parsedQuery.searchParams as string;
}

const searchQueryParamsByKey = (parsedQuery?: ParsedQuery): Map<string, string> => {
    if (!parsedQuery?.queryParams)
        return new Map();
    const groups = new Map<string, string[]>();
    parsedQuery?.queryParams.forEach((q) => {
        let arr = groups.get(q.key);
        if (!arr) {
            arr = [];
            groups.set(q.key, arr);
        }
        arr.push(q.value);
    });
    const groupsJoined = new Map<string, string>();
    groups.forEach((v, k) => {
        groupsJoined.set(k, v.join(','));
    })
    return groupsJoined;
}


const searchQueryParamsFromParsedQuery = (parsedQuery?: ParsedQuery) => {
    const groups = searchQueryParamsByKey(parsedQuery);
    const urlParams: string[] = [];
    groups.forEach((v, k) => {
        urlParams.push(`${k}=${v}`);
    })
    const par = urlParams.join('&');
    if (par.length > 0)
        return '&' + par;
    return par;
}

const navigateToQuery = (parsedQuery: ParsedQuery) => {
    const searchQuery = searchFieldTextFromParsedQuery(parsedQuery);
    const urlParams = searchQueryParamsFromParsedQuery(parsedQuery);
    const toEncode = `https://${window.location.hostname}${urlSearchPath}?term=${searchQuery}${urlParams}`;
    const request = toEncode
    window.location.href = request;

}



const printSuggestions = () => {
    calculateSuggestions();
    suggestionViewToggle.innerHTML = showAllSuggestions ? hideAllSuggetsionsHTML : showAllSuggestionsHTML;
    
    if (lastSuggestions)
    {
        suggestionsContainer.innerHTML = `Suggestions</br><i>${lastSuggestions}</i>`;
       
        try {
            suggestionsWrapper.removeChild(suggestionViewToggle)
            
        } catch (error) {
            
        }
        if(limitedSuggestions)
                suggestionsWrapper.appendChild(suggestionViewToggle)

    }
    else
    {
        try {
            suggestionsWrapper.removeChild(suggestionViewToggle)

        } catch (error) {
            
        }
        suggestionsContainer.innerHTML = `<i>No suggestions available</i>`;

    }
}


// Readable representation of the query object
const parseReadableQuery = (response: QueryResponse): ReadableRepresentation | undefined => {
    let condition: ConditionElement = null as any;
    if (response?.query && response.query.length > 0) {
        condition = response.query[0].condition;
    }
    if(!condition)
        return undefined;
    const status:QueryStatus = {
        faults : [],
        queryParamCounter: 0,
        searchParamCounter : 0
    }
    let ordinaryReadableQuery = parseReadableOrdinaryQuery(status, condition as (ConditionOr | ConditionNot | ConditionAnd | ConditionCompare));
    if(status.searchParamCounter == 0)
    {
        if(status.queryParamCounter > 0)
        {
            status.faults.push(`You have provided ${status.queryParamCounter} ${status.queryParamCounter == 1 ? 'filter' : 'filters'} but no search terms. Try adding "about vitamin d" for example`);
        }
        else 
            status.faults.push('Missing search params. Try writing "about vitamin d" for example');
    }
    if(ordinaryReadableQuery.startsWith('(') && ordinaryReadableQuery.endsWith(')'))
        ordinaryReadableQuery = ordinaryReadableQuery.substring(1,ordinaryReadableQuery.length -1);
    const ret: string[] = [];
    if (ordinaryReadableQuery)
        ret.push(ordinaryReadableQuery);
    return {
        query: ret.join('\n'),
        errors: status.faults
    };
}

const parseUnknownQuery = (input: string, unknown?: Unknown[]): ConditionCompare | undefined => {
    // check if starts with unknown, or end with unknown
    // the reason why we even have to do this and can't have implicit search by text, is that we got multiple text properties
    // and the query API can not assume one field from another (currently). In fact it cant assume text properties implicitly at all currently.
    // It only works for Date, Number and Enums currently. 

    if (!unknown)
        return undefined;
    let startUnknown:ConditionCompare | undefined = undefined;
    let endUnkown:ConditionCompare | undefined = undefined;

    for (let i = 0; i < unknown.length; i++) {
        const u = unknown[i];
        if (u.offset == 0 && u.length > 2) {
            let value = input.substring(u.offset, u.offset + u.length);

            // Starts with unknown?
            if (value.startsWith("\"") && value.endsWith("\"")) {
                value = value.substring(1, value.length - 1);
            }
            startUnknown = {
                compare:
                {
                    key: allFieldsKey,
                    eq: value
                }
            }

        }
        // ends with unnknown?
        if (u.offset + u.length == input.length) {
            let value = input.substring(u.offset, u.offset + u.length);
            if (value.startsWith("\"") && value.endsWith("\"")) {
                value = value.substring(1, value.length - 1);
            }
            endUnkown =  {
                compare:
                {
                    key: allFieldsKey,
                    eq: value
                }
            }
        }
        if(startUnknown && endUnkown)
            break;
    }
    let unknownToUse = startUnknown;
    if(endUnkown?.compare?.eq)
    {
        if(!unknownToUse || !unknownToUse.compare.eq)
            unknownToUse = endUnkown;
        else //combine
        {
            // use end unknown if longer
            unknownToUse.compare.eq = String(unknownToUse?.compare.eq) + ' ' + String(endUnkown?.compare.eq)
        }
    }
    return unknownToUse;
}
/*
const wrap = (text:string) =>
{
    return '</br>' + text + '</br>'
}*/


const indent = (text:string, depth:number = 0) =>
{
    const textLines = text.split("</br>");
    const builder:string[] = [];
    for (let i = 0; i < depth; i++) {
        builder.push('&ensp;&ensp;&ensp;&ensp;')
    }
    const pad = builder.join('');
    return textLines.map(x=>pad+x).join('</br>');
}
const strong = (text:string) =>
{
    return '<strong>' + text+ '</strong>'
}

const pad = (text:string) =>
{
    return ' ' + text+ ' '
}

const italic = (text:string) =>
{
    return '<i>' + text+ '</i>'
}
const wrapJoin = (arr:string[],delimiter:string) =>
{
    return arr.join('</br>'+ delimiter+'</br>')
}
const conditionsReadable = (status:QueryStatus, condition:(ConditionAnd|ConditionOr), depth, insideOr:boolean = false, insideNot = false) =>
{
    let delimiter = strong('AND');
    let arr = ((condition as ConditionAnd).and);
    if(!arr)
    {
        delimiter = strong('OR');
        arr = ((condition as ConditionOr).or);
        insideOr = true;
    }
    
    if(!arr)
        return null;
    
    const join: string[] = [];
    arr.forEach((element) => {
        const compare = parseReadableOrdinaryQuery(status, element as (ConditionOr | ConditionNot |ConditionAnd | ConditionCompare), 1,insideOr, insideNot);
        if (compare)
        join.push(compare);
    });
    return indent(join.length > 1 ? `${wrapJoin(join,delimiter)}` : join[0],depth);
}

const parseReadableOrdinaryQuery = (status:QueryStatus, condition: (ConditionOr | ConditionNot |ConditionAnd | ConditionCompare), depth = 0, insideOr:boolean = false, insideNot = false):string => {
    if(!condition)
        return '';
    const fromArOr = conditionsReadable(status,condition as (ConditionOr|ConditionAnd), depth,insideOr,insideNot);
    if(fromArOr)
        return fromArOr;
        
    if ((condition as ConditionNot).not) {
        const nested = parseReadableOrdinaryQuery(status, (condition as ConditionNot).not as (ConditionOr | ConditionNot |ConditionAnd | ConditionCompare), 1,insideOr, true);
        const nestedNewLines = nested.indexOf('</br>') != -1;
        if(!nestedNewLines)
        return indent(`${strong('NOT') + ' ' + nested}`,depth - 1);
        return indent(`${strong('NOT') + '</br>' + nested}`,depth - 1);
    }
    if ((condition as ConditionCompare).compare) {
        const compElements: string[] = [];
        const comp = (condition as ConditionCompare).compare;        
        let suffix = '';
        if(queryParamKeys.has(comp.key))
        {
            suffix = ' (filter)'
         
        }
     
        compElements.push(firstDescription(fieldsByKey[comp.key].description) + suffix );

        if (comp.eq) {
            compElements.push(pad(strong('=')) + formatValue(comp.key, comp.eq));
        }
        else if (comp.gt) {
            compElements.push(pad(strong('>')) + formatValue(comp.key, comp.gt));
        }
        else if (comp.gte) {
            compElements.push(pad(strong('≥')) + formatValue(comp.key, comp.gte));
        }
        else if (comp.lt) {
            compElements.push(pad(strong('<')) + formatValue(comp.key, comp.lt));
        }
        else if (comp.lte) {
            compElements.push(pad(strong('≤')) + formatValue(comp.key, comp.lte));
        }
        else if (comp.neq) {
            compElements.push(pad(strong('≠')) + formatValue(comp.key, comp.neq));
        }

        const conditionReadable = compElements.join('');
        if(queryParamKeys.has(comp.key))
        {
            status.queryParamCounter ++;
            if(insideNot)
            {
                status.faults.push('Not allowed to use NOT with filter "' +   conditionReadable + '"');
            }

            if(insideOr)
            {
                status.faults.push('Not allowed to use OR with filter "' +   conditionReadable + '"');

            }
            if(!comp.eq)
            {
                status.faults.push('You are only allowed use filter properties with "=" comparator. Your query contains "' +   conditionReadable + '"');

            }
        }
        else {
            status.searchParamCounter ++;
        }


        return conditionReadable;
    }
    return '';
}


const negative = (condition):string => 
{
    return ' NOT ' + condition;
}


const parseQueryResponse = (condition:(ConditionAnd | ConditionNot | ConditionCompare | ConditionOr)): ParsedQuery => {
    if (!condition)
        return {};

    const ordinaryConditions = parseOrdinaryConditions(condition);
    const merged = mergeParsedQueries([ordinaryConditions]);
    return merged;
}


const mergeParsedQueries = (queries: ParsedQuery[]): ParsedQuery => {
    const searchParamsBuilder: string[] = [];
    const queryParamsBuilder: any[] = [];
    queries.forEach((q) => {
        if (!q)
            return;
        if (q.searchParams) {
            searchParamsBuilder.push(q.searchParams);
        }
        if (q.queryParams) {
            queryParamsBuilder.push(...q.queryParams);
        }

    })
    return {
        searchParams: searchParamsBuilder.join(' '),
        queryParams: queryParamsBuilder
    }

}

const parseDateConditions = (condition: ( ConditionCompare)): ParsedQuery => {
    let dateConditionParam:string = '';

    const today = new Date().getTime();
    const firstTime = new Date('1864-01-01T00:00:00').getTime();

    const comp = (condition as ConditionCompare).compare;
    if(dateKeys.has(comp.key))
    {
        const dateKey = comp.key;
        if (comp.eq) {
            dateConditionParam = `(\"${formatDate(comp.eq)}\"[${dateKey}] : \"${formatDate(comp.eq)}\"[${dateKey}])`;
        }
        else if (comp.lt) {
            dateConditionParam =(`(\"${formatDate(firstTime)}\"[${dateKey}] : \"${formatDate(dayBefore(comp.lt))}\"[${dateKey}])`)
        }
        else if (comp.lte) {
            dateConditionParam =(`(\"${formatDate(firstTime)}\"[${dateKey}] : \"${formatDate(dayBefore(comp.lte))}\"[${dateKey}])`)
        }
        else if (comp.gt) {
            dateConditionParam = (`(\"${formatDate(dayAfter(comp.gt))}\"[${dateKey}] : \"${formatDate(today)}\"[${dateKey}])`)
        }
        else if (comp.gte) {
            dateConditionParam = (`(\"${formatDate(comp.gte)}\"[${dateKey}] : \"${formatDate(today)}\"[${dateKey}])`)
        }
        else if(comp.neq) {
            dateConditionParam = negative(`(\"${formatDate(comp.neq)}\"[${dateKey}] : \"${formatDate(comp.neq)}\"[${dateKey}])`)
        }
    
    
    
    }
        
        //dateConditionParams.push(`(\"${formatDate(sorted[0])}\"[${dateKey}] : \"${formatDate(sorted[1])}\"[${dateKey}])`);
           
 
    if(dateConditionParam?.length > 0)
        return {
            searchParams: dateConditionParam
        };
    return {};
}

const searchParamsJoin = (args:string[], boolean:string) =>
{
    if(!args || args.length == 0)
        return '';
    const builder:string[] = [];
    // make sure first arg does not start with "NOT"
    if(args[0].startsWith(' NOT '))
    {
        let newStartIndex = 0;
        for (let i = 1; i < args.length; i++) {
            if(!args[i].startsWith(' NOT '))
            {
                newStartIndex = i;
                break;
            }
        }
        if(!newStartIndex)
        {
            throw new Error('Can not currently handle that combination of NOT booleans. Please try to minimize the use of NOT booleans, or NOT with nested conditions')
        }
        const temp = args[0];
        args[0] = args[newStartIndex];
        args[newStartIndex] = temp;
    }
    args.forEach((arg)=>
    {
        if(arg == '()')
            return;
        if(arg.startsWith(' NOT '))
        {
            builder.push(arg);
        }
        else if(builder.length > 0)
        {
            builder.push(boolean + arg);
        }
        else 
        {
            builder.push(arg);
        }
    })
    return builder.join('');
}



const parseOrdinaryConditions = (condition: ConditionElement): ParsedQuery => {
    if (!condition)
        return {};
    if ((condition as ConditionAnd).and) {
        const searchParams: string[] = [];
        const queryParams: any[] = [];
        (condition as ConditionAnd).and.forEach((element) => {
            const parseResult = parseQueryResponse(element as (ConditionAnd | ConditionNot | ConditionCompare | ConditionOr));
            if (parseResult.searchParams)
                searchParams.push(parseResult.searchParams);
            if (parseResult.queryParams)
                queryParams.push(...parseResult.queryParams)
            
        });
        return {
            searchParams: `(${searchParamsJoin(searchParams,' AND ')})`,
            queryParams: queryParams
        };
    }
    if ((condition as ConditionOr).or) {
        const searchParams: string[] = [];
        const queryParams: any[] = [];

        (condition as ConditionOr).or.forEach((element) => {
            const parseResult = parseQueryResponse(element as (ConditionAnd | ConditionNot | ConditionCompare | ConditionOr));
            if (parseResult.searchParams)
                searchParams.push(parseResult.searchParams);
            if (parseResult.queryParams)
                queryParams.push(...parseResult.queryParams)
   
        });
        return {
            searchParams: `(${searchParamsJoin(searchParams,' OR ')})`,
            queryParams: queryParams
        };
    }
    if ((condition as ConditionCompare).compare) {
        const comp = (condition as ConditionCompare).compare;
        if(comp.key == allFieldsKey)
        {
            if(comp.eq)
            {
                return {
                    searchParams: String(comp.eq)
                }
            }
            else if(comp.neq)
            {
                return {
                    searchParams:   negative('('+String(comp.neq) + ')')
                }
            }
        }
        else if(comp.key == allFieldsExactKey)
        {
            if(comp.eq)
            {
                return {
                    searchParams: String(comp.eq)
                }
            }
            else if(comp.neq)
            {
                return {
                    searchParams:   negative('("'+String(comp.neq) + '")')
                }
            }
        }
        else if(queryParamKeys.has(comp.key))
        {
        
 
            return {
                queryParams: [
                    {
                        key: 'filter',
                        value: String(comp.eq)
                    }
                ]
            }
        }
        else if(dateKeys.has(comp.key))
        {
            return parseDateConditions(condition as ConditionCompare);
        }
        else if(comp.eq)
        {
            return {
                searchParams: `${comp.eq}[${comp.key}]`
            }
        }
        else if(comp.neq)
        {
            return {
                searchParams:   negative(`${comp.neq}[${comp.key}]`)
            }
        }
    }

    if ((condition as ConditionNot).not) {
        const nested = parseQueryResponse((condition as ConditionNot).not as (ConditionAnd | ConditionNot | ConditionCompare | ConditionOr));
        if(nested.searchParams?.startsWith(' NOT '))
        {
            // NOT NOT = NOTHING
            return {
                searchParams: nested.searchParams.substring(' NOT '.length)
            }
        }
        return {
            searchParams: negative(nested.searchParams)
        };
    }
  /*  if((condition as ConditionNot).not)
    {
        const nested = parseOrdinaryConditions((condition as ConditionNot).not)
    }*/
    return {};

}
/*
const wordSplit = (words) => {
    if (!words)
        return [];
    return words.replace(/,\s+/g, ",").split(/[\n,\s+]/)
}*/

const formatDate = (ms) => {
    const date = new Date(ms);
    var year = date.getFullYear();

    var month = (1 + date.getMonth()).toString();
    month = month.length > 1 ? month : '0' + month;

    var day = date.getDate().toString();
    day = day.length > 1 ? day : '0' + day;
    return year +  '/' + month + '/' + day;

}
const dayBefore = (ms) => {
    var date = new Date(ms);
    date.setDate(date.getDate() - 1);
    return date.getTime();
}

const dayAfter = (ms) => {
    var date = new Date(ms);
    date.setDate(date.getDate() + 1);
    return date.getTime();
}
const formatValue = (key, value) => {
    const field = fieldsByKey[key];
    let ret = '';
    
    if (field.domain == 'DATE') {
        ret = formatDate(value);
        
    }
    else if (typeof field.domain != 'string' && field.domain[value]) // Enum domain!
    {
        let desc = firstDescription(field.domain[value]);
        if (desc)
            ret = desc;
        else 
            ret = value;
    }
    else ret = value;
    return italic(ret);
}
const firstDescription = (desc) => {
    if (Array.isArray(desc))
        return desc[0];
    if (desc['ANY'])
        return firstDescription(desc['ANY']);
    for (const key of Object.keys(desc)) {
        const d = firstDescription(desc[key]);
        if (d)
            return d;
    }
    return '';
}

// Add listeners for the search field, and set colors for styling (depending on color mode, light, dim, dark)
const  initialize = async () => {
    var inserted = false;
    let maxTriesFind = 50;
    let findCounter = 0;
    await apiKeySetup;
    if(serviceError)
    {
        return; // Do initialize UI
    }
    while (!inserted) {
        const searchField = document.querySelector('body form input[type="search"][spellcheck="false"]') as HTMLInputElement;
        findCounter++;
        if (findCounter > maxTriesFind)
            break;
        if (searchField)
            inserted = true;
        else {
            await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 sec
            continue;
        }
        if (lastSearchField === searchField)
            return;
        lastSearchField = searchField;

        setDynamicStyle();
        restoreLastSearchQuery();
        drawResults();
        document.body.addEventListener("keydown", event => {
            if (event.keyCode === 17) {
                ctrlDown = true;
                return;
            }
        });
        document.body.addEventListener("keyup", event => {
            if (event.keyCode === 17) {
                ctrlDown = false;
            }
            if (event.keyCode === 32) {
                // Space clicked, toggle suggestions
                if (ctrlDown) {
                    showAllSuggestions = !showAllSuggestions;   
                    printSuggestions();
                }
                return;
            }
        });
        document.addEventListener("keydown", event => {

           
            
            if (event.keyCode === 13 && advancedSearchResultFocused) {
                event.cancelBubble = true;
                event.stopImmediatePropagation();
                event.stopPropagation();
                event.preventDefault();
                navigateSearch(true);
                return;
            }
        });

       /* lastSearchField.addEventListener("keypress", () => {
            if(sess?.parsedQuery)
            {
               
            }
        }
        );*/
        lastSearchField.addEventListener("keydown", async (event) => {
            const arrowUp =  event.key == 'ArrowUp';
            const arrowDown =  event.key == 'ArrowDown';
            if(arrowUp || arrowDown)
            {
                // key down
                const focused = lastDefaultAutocompletOptionsFocused;
                if(focused && arrowDown)
                {
                    lastDefaultAutocompletOptionsFocused = false;
                    advancedSearchResultFocused = true;
                }
                else
                {
                    advancedSearchResultFocused = false;

                }
        
                const list = hasDefaultResultsToShow() ?  getDefaultAdvancedSearchAutoCompleteList() : undefined;
                if(list)
                {
                    const lastChild = list.lastChild;
                    if(lastChild)
                    {
                        const el = lastChild as HTMLElement
                        if(el.classList.contains('tt-cursor'))
                        {
                            lastDefaultAutocompletOptionsFocused = true;
                        }
                    }
                }
                else if(arrowDown)
                {
                    advancedSearchResultFocused = true;

                }
            }
            drawResults();

            updateAutoCompleteStyle();
        },
        {
            capture:true
        });
        lastSearchField.addEventListener("keyup", async (event) => {
            if(event.key  == 'ArrowDown' || event.key == 'ArrowUp')
                return;
            hasTypedAnything = true;
            const newVal = event.target && event.target['value'] ? event.target['value'] : ''
            if(newVal == sess.unparsedQuery)
                return;
                
            updateAutoCompleteStyle();       

            sess.unparsedQuery = newVal;
            sess.lastReadableQuery = undefined;
            sess.lastResponse = undefined;
            sess.parsedQuery = undefined;
          //  lastRequestTime = new Date().getTime();
            await load;
            loading();
            load = new Promise((resolve) => {
                debounce(() => {
                    getAndDrawResult(lastSearchField?.value).then(() => {
                        // Hide or show
                        updateAutoCompleteStyle();
                        saveState().then(() => {
                            resolve(true);
                        });
                    }).catch(()=>
                    {
                        resolve(true);

                    });
                }, debounceTime + 1)();
            });
            await load;
            unloading();

        },
        {
            capture:true
        });
        _advancedSearchAutoCompleteContainer.addEventListener("mousedown", (event) => {
            event.cancelBubble = true;
            event.stopImmediatePropagation();
            event.stopPropagation();
            event.preventDefault();
            navigateSearch(true);
        });

        lastSearchField.addEventListener("mousedown", () => {
            
            setTimeout(() => {
                updateAutoCompleteStyle();
                drawResults();
            }, 0);
        });

        window.addEventListener('mousedown',  (e) => {
            if (e.target)
                if (advancedSearchResultContainer.contains(e.target as Node) || lastSearchField?.contains(e.target as Node))
                {
                
                }
                else {
                    ejectResult();
                }
        });


        // Export button
        const toolbar = getExportButtonToolbar() as HTMLElement;
        if(toolbar)
        {
            toolbar.style.display  = 'flex';
            toolbar.style.alignItems = 'center';
            try {
                toolbar.removeChild(exportButton);
            } catch (error) {
                
                toolbar.appendChild(exportButton);
            }                

        }

    }
}

MutationObserver = window.MutationObserver

var observer = new MutationObserver(function() {
   updateAutoCompleteStyle();
});

// define what element should be observed by the observer
// and what types of mutations trigger the callback
if(getDefaultAdvancedSearchAutoCompleteContainer())
observer.observe(getDefaultAdvancedSearchAutoCompleteContainer(), {
  subtree: true,
  attributes: true
});



initialize(); // Starting point 1
chrome.runtime.onMessage.addListener(
     (request) => {
        if (request.message === '__new_url_ql__') {
            initialize();  // Starting point 2
        }
    });
