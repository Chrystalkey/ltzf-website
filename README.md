# LTZF Website
## General Architecture
The Website is built around a static site model since generally no
interactions with the user have to be taken into account.

Data from the Database is 
1. fetched asynchronously
2. converted into html pages and stored locally
3. pushed to some static site serving utility through e.g. rsync

This does not mean that there is no dynamism in the pages. For example
Documents are (generally) not served as full objects but only with their
uuid placeholders. The page then contains a little javascript snipped
that loads them if necessary.

## Requirements
npm
maven
jre

run `npm install superagent` in this directory before starting.
the generated oapicode requires it, but does not generate the
requirement for it.

## Page Structure
/index.html
  +btzf
  +ltzf-overview     :statistics, newest, best, worst laws
    +
  +ltzf-[Bundesland] : statistics, newest, best, worst laws
    +legislaturperioden-archiv
    +aktuelle entwürfe
    +frisch im parlament
    +in den ausschüssen
    +fertig (abgelehnt/beschlossen/veröffentlicht)
    +gesamtübersicht
      +gesetzesvorhaben
        +dokument
      +sitzungen


