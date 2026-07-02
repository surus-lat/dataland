# On the missing data layer and a potential solution

*SURUS Team · Buenos Aires · 2026*

---

## 0. Abstract
Latin America is missing two foundational layers required to build its own AI: a **datasets layer** and a **benchmarks layer**. These are not optional infrastructure — they are the minimum prerequisites for both building and evaluating AI systems. Their absence carries a dual cost. On the industry side, most AI tasks are universal but the data needed to get state-of-the-art performance in a given context is regionally peculiar. On the public-institution side, the cost is different in kind: models trained elsewhere encode foreign value systems, languages, and historical narratives, shaping how citizens are represented, served, and governed. Together, the absence of both layers constitutes a loss in both industrial productivity and sovereign capacity over a technology that is becoming critical infrastructure.

The dataset layer faces two compounding problems: discovery and supply. Latin American datasets exist but are scattered across places like Hugging Face and the appendices of research papers, with no shared index. Even pooled, their volume falls far below what frontier AI development requires. The two problems reinforce each other: with nowhere to publish for return, fewer datasets get released; with few releases, no critical mass forms. The proposed DataHub is designed to break this loop from both ends — indexing what exists and making contribution a visible, rewarded act.

The DataHub is organized around a task-first ontology with three nested levels: **task** (e.g. transcription), then **domain** (e.g. medical), then **language and regional variant** --— (e.g. Rioplatense Spanish). Each level compounds the value of the last, paying off on both sides: for industry, in performance on the target task; for public institutions and the populations they serve, in representation and fit.

We prefer a **multipolar AI world** and believe Latin America should be one of those poles, contributing on its own terms. The DataHub must therefore be open by design — because collaboration matters most for regions not at the frontier — and incentive-driven by construction, since a commons only stays alive when contributors are rewarded. Open questions remain: regulatory heterogeneity across jurisdictions, shared standards for metadata and licensing, collaboration norms, and the institutional incentives needed to unlock data currently kept internal. This paper is a kickstart by the SURUS team on the missing data layer; and an invitation to companies, institutions, and individuals across the region to shape what the foundational infrastructure for Latin American AI should become, and to contribute and benefit from it. 


We prefer a multipolar Arica should be one ofthose poles, contributing on its own terms. The Hub must therefore be open by design — because collabons not at the frontier —and incentive-driven by construction, since a commons only stays alive when contributors are rewarded. Open questions remain: regulatory heterogeneity across jurisdictions, shared standards for metadata and licensing,       collaboration norms, and needed to unlock datacurrently kept internal. This paper is a kickstart by the SURUS team — a working artifact targeting the dataset layer; the benchmark layer is the subject of LatamBoard, athey are an invitation toresearchers, institutionegion to shape what thefoundational infrastructure for Latin American AI should become.




## 1. Introduction

The state of AI in Latin America today is one of consumption. The region uses models built elsewhere, trained on data collected elsewhere, evaluated against tasks defined elsewhere. For genuinely universal and verifiable capabilities — coding, general-purpose reasoning, mathematics — this is workable; outside those, performance degrades on tasks where regional context (represented through data) matters, and no evaluation relevant to the region exists to measure how much.

Two foundational layers are missing: the **dataset layer**, which training requires, and the **benchmark layer**, which evaluation requires. Without datasets, the region cannot train its own models, agents, or downstream systems. Without benchmarks, it cannot evaluate anything it builds — nor evaluate the foreign systems already in use.

This paper targets the dataset layer; the benchmark layer is addressed in LatamBoard, a companion effort by the SURUS team. It covers the cost of both missing layers, the current state of Latin American datasets, the Hub's task-first ontology, the proposed open design, the geopolitical position from which the design follows, and the open problems that remain.

---

## 2. Two Missing Layers, Two Lanes of Cost

These two layers are not optional infrastructure — they are the **minimum prerequisites** for both building and evaluating AI systems. Without datasets, the region cannot train models, agents, or downstream systems — any of them. Without benchmarks, it cannot evaluate what it builds, and — just as critically — cannot evaluate the foreign systems already deployed across its institutions and industries. Both absences are active today.

Without a benchmark layer, industries cannot evaluate the models they procure — and adopted models can underperform silently on the very tasks they were bought to perform. Regional peculiarities matter for most industrially useful tasks; without benchmarks on those tasks, procurement decisions are made blind. The failure is silent: the model returns an output, but not the performance needed for full adoption and diffusion on the tasks that matter.

For public institutions, the absence of benchmarks forecloses something larger: the possibility of becoming **independent auditors** of both regional and worldwide AI systems in use. Some universities independently measure poverty or inequality, producing formal, region-anchored evaluations that their countries and the region use. Latin America's universities and public institutions in general could produce the same for AI: formal evaluations of what models — local and global — get right and wrong for the populations they serve. 

On the industry side, the problem is performance: the task is often universal, but the data needed to perform it at the state-of-the-art is **regionally peculiar**. A pest-classification model trained on European or North American agriculture will not reliably identify the pests that determine harvests in Argentina or Brazil. The task is universal; the crops, the species, and the visual distribution are not. This is the performance gap in concrete form.

On the public-institution side, the cost is different in kind: models trained elsewhere encode foreign value systems, languages, and historical narratives — shaping how citizens are represented, served, and governed. The failure mode is silent — the model works, returns plausible output, and is simply miscalibrated for the population it serves. The cost is not just performance but inclusion and representation: whether AI systems reflect and serve the societies that use them.

The two lanes are not independent. The costs compound each other — and together they constitute a **loss of sovereign capacity** over a technology that is becoming critical infrastructure. A region that cannot build or evaluate AI for its own industries, languages, and institutions cannot capture the gains this technology offers, nor exercise meaningful agency over how it is used inside its borders.

---

## 3. State of Latin American Datasets

The dataset layer faces two compounding problems that must be addressed together. The first is **discovery**; the second is **supply**. They reinforce each other — which is why both must be in scope.

Latin American AI datasets exist — the problem is that they are scattered across places like Hugging Face, the Mozilla Foundation, and the appendices of research papers, with no shared index. A practitioner asking *which datasets can I use to train a model for medical transcription in Rioplatense Spanish?* can answer only by personal network or weeks of search. This is not a failure of any platform; it is the absence of a regionally relevant index.

Even with perfect indexing, the total volume of Latin American datasets would remain far below what frontier AI development requires — and far below what North America, Europe, and Asia have accumulated. This is a structural gap, not a capability one. The gap compounds annually — every year without an active creation effort is a year the distance grows.

These two problems reinforce each other in a loop that, left alone, would persist indefinitely. There is no place to publish a Latin American AI dataset where the contributor sees a return on the act of contributing, so fewer datasets get published; because few are published, no critical mass forms to motivate the next contributor. The loop closes. The **DataHub** is designed to break it from both ends — indexing what already exists (discovery) and making contribution a visible, rewarded act (supply).

---

## 4. A Task-First Ontology for AI
Existing dataset catalogs almost universally organize entries by input modality or by target model — we believe both are wrong. An AI model is fundamentally a program for a task, and task is therefore the first axis. Tasks include transcription, classification, extraction, translation, forecasting, segmentation, and others. 

Existing dataset catalogs almost universally organize entries by input modality or by target model — we believe both are wrong for AI, because an AI model is fundamentally a **program** that performs a **task**. This is also in line with how an AI practitioner works: he/she doesn't start from *I have an image* or *I want to use model X* — they start from *I need a system that does Y.* Thus the right ontology is one organized around what an AI system *does* (e.g. extraction, classification, reasoning, transcription, etc.). This DataHub adopts a **task-first ontology** with two nested levels: **domain** & **language**.

Domain is the second axis because a task without domain context is almost always too broad to achieve the needed performance. Within transcription, medical and legal are different datasets — vocabulary, annotation conventions, etc. A model trained on medical transcription underperforms on legal-domain audio files even within the same language.

The third axis is language — and within language, **regional variant**. Medical transcription in Rioplatense Spanish is not interchangeable with Colombian Spanish or Brazilian Portuguese: clinical vocabulary, patient-facing register, and acoustic patterns all differ.

Each level compounds the value of the last: general transcription is useful, medical transcription is more useful, medical transcription in Rioplatense Spanish is more useful still. The compounding pays off on both sides. For industry, each layer of specificity buys a performance dividend — a Buenos Aires hospital deploying a medical-transcription model tuned to Rioplatense Spanish gets a performance a general model cannot deliver. For public institutions and the populations they serve, the same specificity buys representation and inclusivity — models that actually work for the people who use them.

A practitioner walks this hierarchy from general to specific, and the ontology is designed so that walk is the natural one. The same structure guides a contributor: declaring task, domain, and variant places a dataset in the exact slot where someone searching for it will look. The ontology is the search interface and the publishing form in one.

---

## 5. Open by Design, Incentive-Driven by Construction

On the geopolitical side, we prefer a **multipolar AI world**, and we believe Latin America should be one of those poles — with its own technology and its own agency. This is a position against both single-pole dominance — a world where AI is defined by the United States or China alone — and against a few-pole world that excludes Latin America. The more regions that develop their own AI systems, the better; this is the region's stake in that outcome. It is not an argument against collaboration with other regions; it is an argument *for* Latin America contributing to that collaboration on its own terms.

The question of how to build it — open or closed, shared or proprietary — is a strategic choice, not a neutral technical decision. Different regions have taken different routes: some have built largely closed and proprietary AI ecosystems; others have built open and collaborative ones. Both can produce AI capability. The choice shapes who can participate and how fast a non-frontier region can close the gap.

We argue **open by design** is right for Latin America for a region-specific reason: since collaboration fosters development, collaboration matters most for regions not at the frontier of a technology. For a non-frontier region, the priority is not to protect what it has from competition but to contribute as much as possible, compounding collaborative efforts to close the gap. 

A commons is not self-sustaining by virtue of being a commons. Without explicit incentives, there's no intertia to continue publishing data into a hub. Each new dataset compounds the value of every prior contribution — the index grows more complete, the ontology more populated. Contributors gain something concrete: visibility within the regional AI community, attribution attached to their dataset, and recognition for their institution through brand-awareness.  

The DataHub is not designed as a static catalog but as a **continuum**: it has active contribution, curation, and growth. The contribution path must be low-friction — a researcher who has just produced a dataset should be able to publish it in minutes.

---

## 6. Open Problems

The DataHub does not resolve every question implied by the dataset layer it begins to build. 

Data protection, copyright, and public-data access regimes differ country by country across Latin America. The Hub cannot resolve this — these are matters of national law. What it can and must do is surface the licensing and legal-jurisdiction information of every indexed dataset, so practitioners decide with the relevant context visible.

There are no shared standards for dataset metadata, licensing, or quality in the region. Two datasets nominally about *Spanish transcription* may use incompatible annotation schemas, incompatible licenses, and incompatible quality bars
Collaboration norms — attribution, versioning, and arbitration when a community contests how it is represented — also remain undefined. When one party improves another's dataset, how is credit allocated? These are questions for the regional community to decide together, not for one team to impose.

Companies, universities, governments, and public bodies across Latin America hold significant volumes of data that would be valuable as published datasets — and most of it does not get published. The right incentives for each of these to publish their data remain unknown. The DataHub's visibility mechanisms address part of this — publishing now produces recognition. But the deeper problem requires policy work outside the DataHub: grant requirements that mandate dataset publication, university promotion criteria that value dataset contributions, government open-data policies that treat AI-readable formats as a deliverable.

---

## 7. A Kickstart and an Invitation

This paper is a **kickstart** — a working artifact and a position targeting the dataset layer specifically; the benchmark layer is the subject of LatamBoard, a companion effort. The SURUS team built the first version of the Data Hub because somebody had to begin. Together, the Data Hub and LatamBoard are an invitation — not a finished proposal — and not the work of a single team.

To companies, researchers and institutions holding data: we invite you to publish it into the Hub. Whether the dataset is a paper appendix from three years ago, an active working corpus, or an internal archive that has never been released — the DataHub is built to receive it. Each contribution compounds the value of every prior one.

To AI practitioners across the region: we invite you to use the DataHub and contribute to its improvement. The most important signal that matters is practitioners choosing datasets from it, building models with it, and contributing datasets to it. Usage and contribution is what converts a commons from a directory into infrastructure — and feedback from use is what improves it.

To the broader community — universities, foundations, governments, companies: help shape what the foundational infrastructure for AI in Latin America should become, contribute, and then benefit from it. The ontology will evolve, standards must be debated, and collaboration norms must be defined. None of this is one team's work — and none of the benefit accrues to a single organization.

The dataset layer for Latin American AI will be built by the region, for the region, or it will not be built at all. The DataHub is one step toward that future, and we invite you to join us.
