import { ClassInfo, FieldInfo } from '@quantleaf/query-sdk-node'; //, translate, config
import { StandardDomain } from '@quantleaf/query-schema';

const publicationDateKey = 'Date - Publication';
const completionDateKey = 'Date - Completion';
const creationDateKey = 'Date - Create';
const entryDateKey = 'Date - Entry';
const meSHDateKey = 'Date - MeSH';
const modificationDateKey = 'Date - Modification';

export const dateKeys = new Set<string>([publicationDateKey, completionDateKey,creationDateKey,entryDateKey,meSHDateKey,modificationDateKey]);
export const allFieldsKey = 'allWordsKey';
export const allFieldsExactKey = 'allFieldsExact';
const textAvailabilityKey = 'textAvailability';
const articleTypeKey = 'articleType';
const articleAttributeKey = 'articleAttribute';
const animalTypeKey = 'animalType';
const sexKey = 'sex';
const subjectKey = 'subject';
const journalCategoryKey = 'journalCategory';
const ageKey = 'age';

export const queryParamKeys =  new Set<string>([textAvailabilityKey, articleTypeKey,articleAttributeKey,animalTypeKey,sexKey,subjectKey,journalCategoryKey,ageKey]);


@ClassInfo({
    key: 'pubmed-search',
    description: 'pubmed search'
})
export class GeneralSearch {


    @FieldInfo({
        key: 'Affiliation',
        description: 'affiliation',
        domain: StandardDomain.TEXT
    })
    affiliation: string;

    @FieldInfo({
        key: allFieldsKey,
        description: ["content", "contains", "containing", "about", "all of"],
        domain: StandardDomain.TEXT
    })
    allFields: string;



    @FieldInfo({
        key: allFieldsExactKey,
        description: ["exact match","perfect match","exactly"],
        domain: StandardDomain.TEXT
    })
    allFieldsExact: string;


    
    @FieldInfo({
        key: 'Author',
        description: ['author', 'from'],
        domain: StandardDomain.TEXT
    })
    author: string;

    @FieldInfo({
        key: 'Author - Corporate',
        description: ["author corporate"],
        domain: StandardDomain.TEXT
    })
    authorCorporate: string;

    @FieldInfo({
        key: 'Author - First',
        description: ["author first"],
        domain: StandardDomain.TEXT
    })
    authorFirst: string;

    @FieldInfo({
        key: 'Author - Identifier',
        description: ["author identifier"],
        domain: StandardDomain.TEXT
    })
    authorIdentifier: string;

    @FieldInfo({
        key: 'Author - Last',
        description: ["author last"],
        domain: StandardDomain.TEXT
    })
    authorLast: string;

    @FieldInfo({
        key: 'Book',
        description: ["book"],
        domain: StandardDomain.TEXT
    })
    book: string;
    
    @FieldInfo({
        key: 'Conflict of Interest Statements',
        description: ["conflict ofinterest statements"],
        domain: StandardDomain.TEXT
    })
    cis: string;

    


    @FieldInfo({
        key: publicationDateKey,
        description: ['publication date','from','published','date',publicationDateKey],
        domain: StandardDomain.DATE
    })
    publicationDate: Date;


    @FieldInfo({
        key: creationDateKey,
        description: ['creation date',creationDateKey],
        domain: StandardDomain.DATE
    })
    creationDate: Date;


    @FieldInfo({
        key: completionDateKey,
        description: ['completion date',completionDateKey],
        domain: StandardDomain.DATE
    })
    completionDate: Date;

    @FieldInfo({
        key: entryDateKey,
        description: ['entry date',entryDateKey],
        domain: StandardDomain.DATE
    })
    entryDate: Date;

    @FieldInfo({
        key: meSHDateKey,
        description: ['MeSH date',meSHDateKey],
        domain: StandardDomain.DATE
    })
    meshDate: Date;

    @FieldInfo({
        key: modificationDateKey,
        description: ['modification date',modificationDateKey],
        domain: StandardDomain.DATE
    })
    modificationDate: Date;


    @FieldInfo({
        key: 'EC/RN Number',
        description: ["ec/rn number", "ecrn number", "ec number", "rn number"],
        domain: StandardDomain.TEXT
    })
    ecrn: string;

    @FieldInfo({
        key: 'Editor',
        description: ["editor"],
        domain: StandardDomain.TEXT
    })
    editor: string;

    @FieldInfo({
        key: 'Filter',
        description: ["filter"],
        domain: StandardDomain.TEXT
    })
    filter: string;

    @FieldInfo({
        key: 'Grant Number',
        description: ["grant number"],
        domain: StandardDomain.TEXT
    })
    grantNumber: string;

    
    @FieldInfo({
        key: 'ISBN',
        description: ["ISBN"],
        domain: StandardDomain.TEXT
    })
    isbn: string;

    @FieldInfo({
        key: 'Investigator',
        description: ["investigator"],
        domain: StandardDomain.TEXT
    })
    investigator: string;


    @FieldInfo({
        key: 'Issue',
        description: ["issue"],
        domain: StandardDomain.TEXT
    })
    issue: string;

    @FieldInfo({
        key: 'Journal',
        description: ["journal"],
        domain: StandardDomain.TEXT
    })
    journal: string;

    @FieldInfo({
        key: 'Language',
        description: ["language"],
        domain: StandardDomain.TEXT
    })
    language: string;

    @FieldInfo({
        key: 'Location ID',
        description: ["location ID"],
        domain: StandardDomain.TEXT
    })
    locationID: string;


    @FieldInfo({
        key: 'MeSH Major Topic',
        description: ["MeSH major topic"],
        domain: StandardDomain.TEXT
    })
    meshMajorTopic: string;

    @FieldInfo({
        key: 'MeSH Subheading',
        description: ["MeSH subheading"],
        domain: StandardDomain.TEXT
    })
    meshSubheading: string;


    @FieldInfo({
        key: 'MeSH Terms',
        description: ["MeSH Terms"],
        domain: StandardDomain.TEXT
    })
    meshTerms: string;


    @FieldInfo({
        key: 'Other Term',
        description: ["other term","other terms"],
        domain: StandardDomain.TEXT
    })
    otherTerms: string;


    @FieldInfo({
        key: 'Pagination',
        description: ["pagination"],
        domain: StandardDomain.TEXT
    })
    pagination: string;

    @FieldInfo({
        key: 'Pharmacological Action',
        description: ["pharmacological action"],
        domain: StandardDomain.TEXT
    })
    pharmacologicalAction: string;


    @FieldInfo({
        key: 'Publisher Type',
        description: ["publisher type"],
        domain: StandardDomain.TEXT
    })
    publisherType: string;


    @FieldInfo({
        key: 'Publisher',
        description: ["publisher"],
        domain: StandardDomain.TEXT
    })
    publisher: string;

    @FieldInfo({
        key: 'Secondary Source ID',
        description: ["secondary source ID"],
        domain: StandardDomain.TEXT
    })
    secondarySourceID: string;


    @FieldInfo({
        key: 'Subject - Personal Name',
        description: ["subject personal name", "personal name"],
        domain: StandardDomain.TEXT
    })
    personalName: string;

    @FieldInfo({
        key: 'Supplementary Concept',
        description: ["supplementary concept"],
        domain: StandardDomain.TEXT
    })
    supplementaryConcept: string;

    @FieldInfo({
        key: 'Text Word',
        description: ["text word"],
        domain: StandardDomain.TEXT
    })
    textWord: string;


    @FieldInfo({
        key: 'Title',
        description: ["title"],
        domain: StandardDomain.TEXT
    })
    title: string;

    @FieldInfo({
        key: 'Title/Abstract',
        description: ["title or abstract", "title/abstract", "title and abstract"],
        domain: StandardDomain.TEXT
    })
    titleOrAbstract: string;

    @FieldInfo({
        key: 'Volume',
        description: ["volume"],
        domain: StandardDomain.TEXT
    })
    volume: string;



    @FieldInfo({
        key: textAvailabilityKey,
        description: 'text availability',
        domain: {
            'simsearch1.fha' : 'abstract',
            'simsearch12.fha' : 'free full text',
            'simsearch3.fha' : 'full text'
        }
    })
    textAvailability: string;


   
    @FieldInfo({
        key: articleAttributeKey,
        description: 'article attribute',
        domain: {
            'articleattr.data' : 'associated data filter'
        }
    })
    articleAttribute: string;


    @FieldInfo({
        key: articleTypeKey,
        description: 'article type',
        domain: {
            'pubt.address' : 'address',
            'pubt.booksdocs' : 'books and documents',
            'pubt.casereports' : 'case reports',
            'pubt.clinicalstudy' : 'clinical study',
            'pubt.clinicaltrial' : 'clinical trial',
            'pubt.correctedandrepublishedarticle' : 'corrected and republished article',
            'pubt.lecture' : 'lecture',
            'pubt.meta-analysis' : ['meta analysis','meta-analysis'],
            'pubt.multicenterstudy' : ['multicenter study','multicenter-study'],
            'pubt.pragmaticclinicaltrial' : ['pragmatic clinical trial'],
            'pubt.publishederratum' : ['published erratum'],
            'pubt.review' : ['review'],
            'pubt.systematicreview' : ['systematic review'],


        }
    })
    articleType: string;


    @FieldInfo({
        key: animalTypeKey,
        description: 'animal type',
        domain: {
            'hum_ani.humans' : 'humans',
            'hum_ani.animal' : 'other animals'

        }
    })
    animalType: string;

    @FieldInfo({
        key: sexKey,
        description: 'sex',
        domain: {
            'sex.female' : 'female',
            'sex.male' : 'male'

        }
    })
    sex: string;

    @FieldInfo({
        key: subjectKey,
        description: 'subject',
        domain: {
            'subject.aids' : 'AIDS',
            'subject.cancer' : 'cancer',
            'subject.cam' : 'complementary medicine',
            'subject.systematicreviews' : 'systematic reviews'

        }
    })
    subject: string;

    @FieldInfo({
        key: journalCategoryKey,
        description: 'journal category',
        domain: {
            'journalcategory.dentaljournals' : 'dental journals',
            'journalcategory.dentaljmedlineournals' : 'medline',
            'journalcategory.nursingjournals' : 'nursing journals'


        }
    })
    journalCategory: string;

    @FieldInfo({
        key: ageKey,
        description: 'age',
        domain: {
            'age.allchild' : ['children','child all ages','children in all ages'],
            'age.newborn' : ['newborn','newborns'],
            'age.allinfant' : ['all infant','all infants','infants'],
            'age.infant' : ['infant older than one year','infants older than one year'],
            'age.preschoolchild' : ['pre school child','pre school children'],
            'age.child' : ['child 6 to 12 years'],
            'age.adolescent' : 'adolescents',     
            'age.alladult' : ['adults','adult','grownups','grownup'],
            'age.youngadult' : ['young adult','young adults'],
            'age.adult' : ['adults 19 to 45 years'],
            'age.middleagedaged' : ['middle aged aged'],
            'age.middleaged' : ['middle aged'],
            'age.aged' : ['aged','aged 65 and over'],
            'age.80andover' : ['aged 80 and over']
        }
        }
    )
    age:string;
}

/*

@ClassInfo({
    key: 'text-search',
    description:'text'
})
export class Text extends GeneralSearch
{

}

@ClassInfo({
    key: 'image-search',
    description:'images'
})
export class Images extends GeneralSearch
{
    @FieldInfo({
        key: imageSizeKey,
        description:  ["size"],
        domain: { // Cisz
            'Cisz:i' : ['icon', 'tiny','small'],
            'Cisz:m' : 'medium',
            'Cisz:l' : 'large'
        }
    })
    imageSize:string;

    @FieldInfo({
        key: imageColorKey,
        description:  ["color"],
        domain: { // Cisz
            'ic:trans' : 'transparent',
            'ic:specific,Cisc:red' : 'red',
            'ic:specific,Cisc:orange' : 'orange',
            'ic:specific,Cisc:yellow' : 'yellow',
            'ic:specific,Cisc:green' : 'green',
            'ic:specific,Cisc:teal' : 'teal',
            'ic:specific,Cisc:blue' : 'blue',
            'ic:specific,Cisc:pink' : 'pink',
            'ic:specific,Cisc:purple' : 'purple',
            'ic:specific,Cisc:white' : 'white',
            'ic:specific,Cisc:gray' : 'gray',
            'ic:specific,Cisc:black' : 'black',
            'ic:specific,Cisc:brown' : 'brown',
        }
    })
    imageColor:string;

    @FieldInfo({
        key: imageTypeKey,
        description:  ["image type"],
        domain: {
            'Citp:clipart' : ['clip art','clipart'],
            'Citp:lineart' : ['line art','lineart'],
            'Citp:gif' : ['gif','animation'],
        }
    })
    imageType:string;

    @FieldInfo({
        key: imageLicenseKey,
        description:  ["image type"],
        domain: {
            'Cil:cl' : 'Creative Common license',
            'Citp:ol' : 'Commercial licenses'
        }
    })
    imageLicense:string;

}

@ClassInfo({
    key: 'shopping-search',
    description:'shopping'
})
export class Shopping extends GeneralSearch
{

}

@ClassInfo({
    key: 'news-search',
    description:'news'
})
export class News extends GeneralSearch
{

}*/

