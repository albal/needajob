# needajob

A job search site that shows only entry-level tech jobs, so juniors don't have to wade through senior and mid-level listings.

## Jobs

**Job**:
A single job advert sourced from Adzuna.
_Avoid_: Role, listing, posting, vacancy

**Entry-Level Job**:
A Job whose title contains at least one Entry-Level Marker and no Seniority Marker.
_Avoid_: Junior job, graduate job

**Entry-Level Marker**:
A word or phrase in a Job title that signals it is meant for beginners, e.g. Junior, Graduate, Entry Level, Trainee, Apprentice, Intern, Placement, or a local-language equivalent such as Berufseinsteiger or Stagiaire. "Associate" is deliberately not one.
_Avoid_: Modifier, junior keyword

**Seniority Marker**:
A word or phrase in a Job title that signals it is not entry-level, e.g. Senior, Lead, Principal, Staff, Head, Manager, Director, Architect, II, III. Has local-language equivalents. Its presence disqualifies a Job even when an Entry-Level Marker is also present.

## Searching

**Discipline**:
A tech field the user can choose to search within, e.g. DevOps Engineer or SRE. The set is fixed: Software Engineer, Backend Engineer, Frontend Engineer, Full Stack Engineer, UI Developer, Tech Project Manager, Systems Engineer, Cloud Engineer, DevOps Engineer, Platform Engineer, SRE.
_Avoid_: Role, category, job type

**Discipline Term**:
One of the title phrases, in any supported language, that identifies a Discipline, e.g. "SRE", "Site Reliability" for SRE. A Job can match several Disciplines.
_Avoid_: Keyword, alias

**Stated Salary**:
A salary the advert itself gives. Adzuna's estimated salaries are never shown.
_Avoid_: Predicted salary, estimate

**Search**:
A user's request for Entry-Level Jobs in one Country, optionally narrowed to a Location and to any of one or more Disciplines. No Disciplines means all of them.

**Job Pool**:
The collection of a Country's current Entry-Level Jobs that Searches are answered from, refreshed periodically from Adzuna.
_Avoid_: Cache, index, feed

**Harvest**:
A scheduled refresh that adds a Country's newest Entry-Level Jobs from Adzuna to its Job Pool and drops Jobs older than 30 days.
_Avoid_: Sync, crawl, scrape

**Country**:
One of the national job markets Adzuna covers.

**Location**:
An optional region, or county/state within a region, that narrows a Search. A region includes all its counties. Absent means the whole Country.
_Avoid_: County, area, where

## Saving

**Saved Job**:
A copy of a Job as it was when the user bookmarked it, kept on their own device along with when it was saved.
_Avoid_: Bookmark, favourite
