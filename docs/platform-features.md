# Platform feature catalogue

Generated from `public/features.js`. The Bærel requirements specification derives the data platform’s features from each organisation’s answers. Each signal that is met adds its weight; the total sets the priority: **≥ 4 must have**, **≥ 2 should have**, **≥ 1 could have**, otherwise not indicated. Negative weights argue against a feature. “Shaped by” lists questions whose selected options configure the feature (e.g. which systems the connectors must reach).

## Platform profile

Parameters read directly from single answers:

- **How fast data must be available** — q26: How quickly must new data normally become available?
- **Data volume per year** — q39: Roughly what data volume would your organisation contribute per year?
- **Retention** — q40: How long must lifecycle data remain retrievable and interpretable?
- **Hosting** — q50: Where should platform data be hosted?
- **Jurisdiction and control** — q203: How important is it that vendor, operations, data and key technology are under local or European jurisdiction and control?
- **Governance model** — q21: Which governance model would be acceptable for a cross-company platform?
- **Integration pattern** — q42: Which integration pattern do you prefer?
- **Corrections and history** — q43: How should corrections, disputes and changing facts be handled?
- **Agent autonomy** — q58: What level of autonomy should AI agents have on the platform?
- **Agent-to-agent across organisations** — q158: How should agent-to-agent exchange across organisations be governed?
- **Passport identifies** — q184: At which level should the passport identify the product?
- **Who operates the passports** — q188: Who should store and operate your product passports?
- **Signing** — q196: How should data in the passport be signed and verified?
- **Deviation in the middle of the night** — q147: What should happen when something unexpected occurs at three in the morning?
- **Open source** — q208: What is your stance on open source in the platform?
- **Route to the platform** — q210: What is the right route to such a platform for you?
- **Budget per year** — q198: What could the organisation realistically spend per year to take part in such a platform — licences, operations and integration combined?
- **Pricing model** — q200: Which pricing model do you prefer?

## Ingestion and integration

### Source-system connectors (`connectors`)

Ready-made connectors, with mapping into the common model, for the systems the organisation runs — so data arrives without manual export.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q23 | Which systems or data sources should be connected? | ≥ 1 selected (of listed options) | +2 |
| q23 | Which systems or data sources should be connected? | ≥ 4 selected | +1 |
| q73 | Which area should receive the highest priority? | any of “Platform and system integration” | +1 |
| q199 | Which costs worry you most? | any of “Integration with our own systems (ERP, PLM, MES)” | +1 |
| q228 | Which examples of data do you have — or wish you had? Add one example per dataset, with files where you have t… | any of “Database extract (SQL)”, “API response or message stream” | +1 |

Shaped by: q23

### Document and PDF extraction (`docextract`)

Turns declarations, certificates and reports in PDF or scans into structured data, with a reference back to the source document.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q11 | Which data-quality problems do you experience most often? | any of “Data locked in PDFs, paper or vendor systems” | +2 |
| q120 | What makes footprint accounting difficult for you today? | any of “Data arrives as PDFs that cannot be processed automatically” | +2 |
| q33 | How is lifecycle data mainly stored and exchanged in your organisation today? | any of “Paper or non-digital records”, “PDFs, scans and other documents” | +1 |
| q23 | Which systems or data sources should be connected? | any of “Documents, PDFs and scans” | +1 |
| q228 | Which examples of data do you have — or wish you had? Add one example per dataset, with files where you have t… | any of “PDF or other documents” | +1 |

### Low-barrier participation for small suppliers (`lowbarrier`)

Web forms, spreadsheet templates and uploads that need no IT of one's own — with validation that says what is missing.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q31 | How important is it that small suppliers with little IT capacity can contribute data with minimal effort? | rated ≥ 4 | +3 |
| q4 | How large is your organisation? | any of “Micro (fewer than 10 employees)”, “Small (10–49)” | +1 |
| q33 | How is lifecycle data mainly stored and exchanged in your organisation today? | any of “Spreadsheets and ad-hoc files” | +1 |
| q73 | Which area should receive the highest priority? | any of “Ease of participation for small organisations” | +2 |
| q228 | Which examples of data do you have — or wish you had? Add one example per dataset, with files where you have t… | any of “Spreadsheet or CSV” | +1 |

### Event streaming and real-time ingest (`streaming`)

Publish–subscribe for events and measurements, with notifications when something changes, instead of nightly file transfers.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q26 | How quickly must new data normally become available? | any of “Sub-second”, “Within seconds”, “Within minutes” | +2 |
| q42 | Which integration pattern do you prefer? | any of “Event streaming / publish-subscribe” | +2 |
| q61 | How should applications and agents access the platform? | any of “Event streams / subscriptions” | +1 |
| q38 | What is the largest or most demanding type of data the platform must handle? | any of “High-frequency sensor and process streams”, “Test and measurement waveforms” | +1 |
| q192 | What are your requirements for exchanging passport data between systems? | any of “Notification when a passport changes” | +1 |
| q228 | Which examples of data do you have — or wish you had? Add one example per dataset, with files where you have t… | any of “API response or message stream”, “Time series or sensor log” | +1 |

Shaped by: q26

### Federated query and data-space connectors (`federation`)

Data stays with its owner and is queried where it lives, through data-space connectors (e.g. Eclipse Dataspace Components) and a shared catalogue.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q42 | Which integration pattern do you prefer? | any of “Federated — data stays in source systems and is queried where it lives”, “Peer-to-peer exchange on request”, “Hybrid — central index or catalogue, federated payloads” | +2 |
| q50 | Where should platform data be hosted? | any of “On-premise at each participating company”, “Federated — each party hosts its own data and shares on request” | +2 |
| q21 | Which governance model would be acceptable for a cross-company platform? | any of “Consortium or data-space governance with shared rules”, “Federated — each company keeps control and shares bilaterally” | +1 |
| q41 | Which existing standards or information models should the platform build on? | any of “Gaia-X, IDSA or Eclipse Dataspace Components” | +1 |
| q178 | Which measures should govern the data volume and energy use of the platform and its agents? | any of “Share on request (pull) instead of copying everything (push)” | +1 |
| q136 | Which properties must be built in from the start for the platform to withstand such changes? | any of “Federated design — one outage does not stop everyone” | +1 |

Shaped by: q42

### Semantic mapping of partner data (`mapping`)

Maps suppliers' and partners' own formats into the common model — with AI suggestions a person approves.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q29 | How important is a common semantic / information model shared across systems and companies? | rated ≥ 4 | +2 |
| q55 | Which AI-supported capabilities would create the most value for your organisation? | any of “Automatic mapping of supplier or partner data into the common model” | +2 |
| q11 | Which data-quality problems do you experience most often? | any of “Inconsistent formats”, “Unclear definitions” | +1 |
| q44 | How important is schema flexibility — being able to add new attributes, product types or partners without rede… | rated ≥ 4 | +1 |

### Edge node: filtering, fusion and buffering (`edge`)

Software close to the source that cleans, fuses and compresses data, and buffers it while the connection is down.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q64 | Where would edge processing — computing close to the data source — be most useful? | ≥ 1 selected (of listed options) | +1 |
| q65 | What should be performed at the edge? | ≥ 2 selected | +1 |
| q67 | Why should processing happen locally rather than centrally? | any of “Low latency”, “Offline or intermittent-connectivity operation”, “Protecting IP while still sharing results”, “Reduced data volume” | +1 |
| q178 | Which measures should govern the data volume and energy use of the platform and its agents? | any of “Process at the edge to avoid transferring raw data” | +1 |
| q73 | Which area should receive the highest priority? | any of “Edge processing” | +2 |
| q64 | Where would edge processing — computing close to the data source — be most useful? | any of “Not relevant for us” | -2 |

Shaped by: q64, q65

## Data model and storage

### Product and lifecycle knowledge graph (`graph`)

Links products, components, materials, organisations and events, so cross-chain traceability becomes a lookup.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q34 | Which storage and modelling approaches do you consider appropriate for the shared platform? | any of “Knowledge graph linking products, components, materials, organisations and events”, “Temporal (bitemporal) knowledge graph that also records how knowledge changed over time” | +2 |
| q28 | How important is end-to-end product and process traceability across organisations? | rated ≥ 4 | +2 |
| q25 | Which identifiers should link information across the lifecycle and across organisations? | ≥ 3 selected | +1 |
| q41 | Which existing standards or information models should the platform build on? | any of “W3C semantic web standards (RDF, OWL, SHACL, JSON-LD)” | +1 |
| q73 | Which area should receive the highest priority? | any of “Data model and semantics”, “Digital thread and traceability” | +1 |

### Versioned, time-aware history (`temporal`)

Nothing is silently overwritten: corrections are stored as new facts, and one can ask what was known about a product at a given time.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q36 | How important is it that the platform can answer: “what did we know about this product at a given point in tim… | rated ≥ 4 | +2 |
| q43 | How should corrections, disputes and changing facts be handled? | any of “Append-only version history; corrections recorded as new facts”, “Immutable, signed event log”, “Both: current view plus full history” | +2 |
| q34 | Which storage and modelling approaches do you consider appropriate for the shared platform? | any of “Temporal (bitemporal) knowledge graph that also records how knowledge changed over time” | +1 |
| q136 | Which properties must be built in from the start for the platform to withstand such changes? | any of “Full version history — nothing is silently overwritten” | +1 |
| q43 | How should corrections, disputes and changing facts be handled? | any of “Overwrite the previous value” | -1 |

Shaped by: q43

### Time-series store for sensor and process data (`timeseries`)

Storage and downsampling of high-frequency measurements, linked to product, process step and equipment.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q34 | Which storage and modelling approaches do you consider appropriate for the shared platform? | any of “Time-series database for sensor, process and condition data” | +2 |
| q38 | What is the largest or most demanding type of data the platform must handle? | any of “High-frequency sensor and process streams”, “Test and measurement waveforms” | +2 |
| q23 | Which systems or data sources should be connected? | any of “SCADA / historian”, “PLC and machine data”, “Sensors / IoT” | +1 |
| q223 | Which data would the models need from the platform to stay current? | any of “Sensor and operating data from the field”, “Environmental and usage conditions (temperature, humidity, load)” | +1 |
| q228 | Which examples of data do you have — or wish you had? Add one example per dataset, with files where you have t… | any of “Time series or sensor log” | +1 |

### Large-object storage: images, video, CAD and documents (`objects`)

Object storage with metadata and access control for large and unstructured files, linked to the product they concern.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q38 | What is the largest or most demanding type of data the platform must handle? | any of “Images and photographs”, “CAD and simulation models”, “Video, X-ray or CT inspection data”, “First-person video and audio from wearables” | +2 |
| q34 | Which storage and modelling approaches do you consider appropriate for the shared platform? | any of “Document store for reports, certificates and declarations”, “Data lake / lakehouse for large or raw datasets” | +1 |
| q39 | Roughly what data volume would your organisation contribute per year? | any of “100 GB – 10 TB”, “More than 10 TB” | +1 |
| q228 | Which examples of data do you have — or wish you had? Add one example per dataset, with files where you have t… | any of “PDF or other documents”, “Images or video”, “CAD or 3D models” | +1 |

Shaped by: q38, q39

### Identifier registry and resolver (`idresolver`)

Links serial numbers, GTINs, batches, component and passport IDs across lifecycle and organisations, and resolves them from a link or a tag.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q25 | Which identifiers should link information across the lifecycle and across organisations? | ≥ 2 selected | +2 |
| q183 | Which identifier scheme do you use or plan for the product passport? | any of “GS1 (GTIN with serial number, GS1 Digital Link)”, “Self-issued identification link under IEC 61406”, “Decentralised identifiers (W3C DID)”, “ISO/IEC 15459 identifiers (issuing agency)”, “DOI” | +1 |
| q185 | Which identifiers do you have for operators and facilities? | any of “LEI (Legal Entity Identifier)”, “GLN (GS1 Global Location Number)”, “EORI number”, “National business register number”, “D-U-N-S” | +1 |
| q28 | How important is end-to-end product and process traceability across organisations? | rated ≥ 4 | +1 |

Shaped by: q25, q183

### Data catalogue with ownership and metadata (`catalogue`)

A searchable overview of which data exists, who owns it, what it means and how fresh it is.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q27 | How important is a searchable data catalogue describing what data exists and who owns it? | rated ≥ 4 | +2 |
| q11 | Which data-quality problems do you experience most often? | any of “Unclear definitions”, “Poor or missing metadata” | +1 |
| q157 | Which consequences of growing data volume concern you most? | any of “Noise — it gets harder to find what matters” | +1 |
| q42 | Which integration pattern do you prefer? | any of “Hybrid — central index or catalogue, federated payloads” | +1 |

### Standards-based information models (`standards`)

The common model builds on, and exports to, the standards you name — not locked to one.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q41 | Which existing standards or information models should the platform build on? | ≥ 1 selected (of listed options) | +2 |
| q41 | Which existing standards or information models should the platform build on? | ≥ 3 selected (of listed options) | +1 |
| q136 | Which properties must be built in from the start for the platform to withstand such changes? | any of “Mapped to several standards, not locked to one” | +1 |
| q29 | How important is a common semantic / information model shared across systems and companies? | rated ≥ 4 | +1 |

Shaped by: q41

## Trust, security and governance

### Fine-grained access control and data ownership (`access`)

The owner decides who sees what, down to field and dataset, using roles, attributes and time-limited grants.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q15 | How important is fine-grained, role-based access control? | rated ≥ 4 | +2 |
| q12 | How important is confidentiality for the data platform? | rated ≥ 4 | +1 |
| q17 | Which restrictions or governance requirements must be considered? | ≥ 2 selected | +1 |
| q59 | What conditions must be met before you would allow an AI agent to access your data? | any of “Per-field or per-dataset access control” | +1 |
| q195 | Which information in the passport must be restricted, and for whom? | any of “Material composition and suppliers (trade secrets)”, “Repair and disassembly instructions — authorised parties only”, “Carbon footprint and its calculation basis”, “Usage and failure data from the field”, “Personal data about the owner or user” | +1 |

Shaped by: q17

### Usage policies that travel with data, and data contracts (`usagecontrol`)

Machine-readable terms for what data may be used for (e.g. ODRL), and agreements on schema, quality and service levels between parties.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q163 | Which mechanisms for trust and control should the platform support? | any of “Usage and access policies that travel with the data (usage control, e.g. ODRL)”, “Data contracts with schema, quality requirements and service levels” | +2 |
| q158 | How should agent-to-agent exchange across organisations be governed? | any of “Only pre-approved, machine-readable agreements (data contracts) between known parties”, “Within a shared framework for rules, identity and audit, operated by a neutral party (e.g. a data space)” | +2 |
| q17 | Which restrictions or governance requirements must be considered? | any of “Competition-law limits on information sharing”, “Contractual or project-based access restrictions” | +1 |
| q142 | What would make you stop contributing data? | any of “Data leaked or was used for something other than agreed”, “A competitor gained insight we had not accepted”, “The data was used to squeeze us on price” | +1 |

### Tamper-evident audit log (`audit`)

Every read and change — by people and agents — is recorded in a log that cannot be altered undetected.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q16 | How important is auditability of data access and changes? | rated ≥ 4 | +2 |
| q163 | Which mechanisms for trust and control should the platform support? | any of “Signed, tamper-evident audit logs (append-only)” | +2 |
| q59 | What conditions must be met before you would allow an AI agent to access your data? | any of “Complete audit log of every agent action” | +1 |
| q13 | How important is data integrity — that records cannot be altered undetected? | rated ≥ 4 | +1 |
| q150 | What changes on the security side when the building is empty and control happens from outside? | any of “Logs must be tamper-evident to carry evidential weight” | +1 |

### Signed records and verifiable credentials (`signing`)

Data is signed by whoever stands behind it, so the recipient can check origin and integrity — even without the platform.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q196 | How should data in the passport be signed and verified? | any of “W3C Verifiable Credentials”, “eIDAS electronic attestations or seals”, “Digital seals under ISO 22376” | +2 |
| q163 | Which mechanisms for trust and control should the platform support? | any of “Digital signatures on individual records”, “Decentralised identifiers and verifiable credentials (W3C DID / VC)” | +2 |
| q136 | Which properties must be built in from the start for the platform to withstand such changes? | any of “Signed records verifiable without the platform” | +1 |
| q47 | If some form of tamper-evidence is needed, which data would justify it? | ≥ 1 selected (of listed options) | +1 |
| q13 | How important is data integrity — that records cannot be altered undetected? | rated ≥ 4 | +1 |

Shaped by: q196, q47

### Distributed-ledger anchoring (`ledger`)

Selected events (e.g. ownership transfers) are anchored in a distributed ledger — only where you consider it necessary.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q46 | What is your view on blockchain or distributed-ledger technology for this platform? | any of “Essential — trust between parties cannot be established without it” | +4 |
| q46 | What is your view on blockchain or distributed-ledger technology for this platform? | any of “Useful for specific data only, such as ownership transfer or certificates” | +2 |
| q46 | What is your view on blockchain or distributed-ledger technology for this platform? | any of “Not needed — signatures, audit logs and contracts are enough”, “Undesirable — cost, complexity, confidentiality or energy concerns” | -3 |

### Provenance and lineage — measured, declared or inferred (`lineage`)

Every value shows where it came from, who produced it, and whether it was measured, declared by a party, or inferred by a model or agent.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q14 | How important is data lineage and provenance — knowing where a value came from and who produced it? | rated ≥ 4 | +2 |
| q60 | How important is it that agent-generated or inferred data is clearly distinguishable from measured, verified o… | rated ≥ 4 | +2 |
| q11 | Which data-quality problems do you experience most often? | any of “Difficult-to-trace data origin” | +1 |
| q224 | What must be in place for you to trust a model that changes itself? | any of “Traceability: which model version and which data a result is based on” | +1 |

### Data-quality rules and quality gates (`quality`)

Rules that check completeness, validity and consistency on ingest, and stop or flag data that falls short.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q11 | Which data-quality problems do you experience most often? | ≥ 2 selected (of listed options) | +1 |
| q55 | Which AI-supported capabilities would create the most value for your organisation? | any of “Automatic data-quality checking, validation and cleaning” | +2 |
| q163 | Which mechanisms for trust and control should the platform support? | any of “Data contracts with schema, quality requirements and service levels” | +1 |
| q157 | Which consequences of growing data volume concern you most? | any of “Poorer data quality and conflicting versions” | +1 |
| q75 | Besides the circularity outcomes you named at the start, which measurable outcome would be most valuable to de… | any of “Reduced manual data preparation” | +1 |

Shaped by: q11

### Sovereign operation and jurisdiction (`sovereign`)

Operations, data and key technology under Norwegian or European jurisdiction, without dependence on a single cloud provider.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q203 | How important is it that vendor, operations, data and key technology are under local or European jurisdiction … | any of “Essential — Norwegian or Nordic vendor, operations and jurisdiction”, “Essential — European jurisdiction and control over data, operations and key technology” | +3 |
| q203 | How important is it that vendor, operations, data and key technology are under local or European jurisdiction … | any of “Important — we prefer European solutions when they are good enough”, “Only the data must stay local — the vendor can be global” | +1 |
| q50 | Where should platform data be hosted? | any of “On-premise at each participating company”, “Private cloud”, “EU-based public cloud”, “Federated — each party hosts its own data and shares on request” | +1 |
| q17 | Which restrictions or governance requirements must be considered? | any of “Data residency / sovereignty” | +1 |
| q169 | What about such a concentration of technology power concerns you most? | any of “Services being stopped or restricted for political reasons”, “Foreign government access to data (e.g. the US CLOUD Act)” | +1 |
| q136 | Which properties must be built in from the start for the platform to withstand such changes? | any of “Independence from any single cloud provider or region” | +1 |

Shaped by: q50, q203

### Country of origin and jurisdiction along the chain (`origin`)

Shows which country and jurisdiction data, components and services belong to along the chain.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q173 | Should the platform show country of origin and jurisdiction for data, components and services along the value … | any of “Yes, for everything”, “Yes, for critical components and data” | +3 |
| q173 | Should the platform show country of origin and jurisdiction for data, components and services along the value … | any of “Only where regulation requires it” | +1 |
| q172 | Where do you feel or expect the consequences? | any of “Requirements to document origin or exclude specific suppliers” | +1 |
| q171 | How exposed is your value chain to geopolitical tensions between the US, China and Europe? | rated ≥ 4 | +1 |

### Full export, portability and hand-over (`exit`)

One's own data can be exported at any time in open formats, and operations can be taken over if the operator disappears.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q136 | Which properties must be built in from the start for the platform to withstand such changes? | any of “Full export of your own data at any time, in open formats”, “No vendor-specific formats — data readable without the platform”, “Operations can be taken over by another operator”, “An agreed arrangement for the data if operations cease” | +2 |
| q137 | If the operator disappeared in five years, what should happen to the data? | any of “Returned to each participant in an open format”, “A neutral body takes over — industry organisation, public authority or research institute”, “Placed in escrow with a third party on agreed terms” | +1 |
| q169 | What about such a concentration of technology power concerns you most? | any of “Lock-in — switching becomes hard and expensive” | +1 |
| q199 | Which costs worry you most? | any of “The cost of switching vendor later” | +1 |
| q209 | What matters most to you about open source? | any of “Avoiding lock-in” | +1 |

Shaped by: q137

### Offline operation and synchronisation (`offline`)

Local nodes and readers keep working when the connection is down, and synchronise without conflicts when it returns.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q152 | How important is it that the site can keep running unattended when the connection to the platform is lost — an… | rated ≥ 4 | +2 |
| q136 | Which properties must be built in from the start for the platform to withstand such changes? | any of “Works for periods without a network connection” | +1 |
| q192 | What are your requirements for exchanging passport data between systems? | any of “Reading without a network connection (e.g. during disassembly)” | +1 |
| q65 | What should be performed at the edge? | any of “Store-and-forward when connectivity is lost” | +1 |
| q67 | Why should processing happen locally rather than centrally? | any of “Offline or intermittent-connectivity operation” | +1 |

### Privacy-preserving computation (`privacy`)

Analysis across organisations without moving raw data: federated learning, differential privacy or secure enclaves.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q163 | Which mechanisms for trust and control should the platform support? | any of “Privacy-preserving computation (federated learning, differential privacy, secure enclaves)” | +2 |
| q157 | Which consequences of growing data volume concern you most? | any of “Trade secrets that can be inferred from combined data” | +1 |
| q65 | What should be performed at the edge? | any of “Aggregation or anonymisation before sharing”, “Privacy- or IP-preserving processing” | +1 |
| q67 | Why should processing happen locally rather than centrally? | any of “Protecting IP while still sharing results” | +1 |
| q120 | What makes footprint accounting difficult for you today? | any of “Confidentiality — suppliers will not disclose figures” | +1 |

## Product passport and compliance

### Product passport: issuance, registry and lifecycle API (`dpp`)

Create, read, update and retire product passports under EN 18216–18223, with registration in the EU DPP Registry.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q181 | How prepared is the organisation for the Digital Product Passport requirements and the standards EN 18216–1822… | any of “Mapping what is required for our products”, “Pilot or project under way”, “Passports in operation for some products” | +2 |
| q190 | Which lifecycle operations must be possible through an API? | ≥ 2 selected | +2 |
| q117 | Who requires footprint data from you today, or is expected to? | any of “ESPR and the Digital Product Passport” | +1 |
| q10 | Which circularity outcomes matter most to your organisation? | any of “Regulatory compliance (ESPR, Digital Product Passport, WEEE, RoHS, REACH, CSRD)” | +1 |
| q182 | What makes product passports relevant for you first? | any of “Batteries (required from February 2027)”, “ICT products and electronics (around 2029 in the Commission’s plan)”, “Components we supply to customers who need passports themselves” | +1 |
| q73 | Which area should receive the highest priority? | any of “Digital Product Passport and compliance” | +1 |
| q181 | How prepared is the organisation for the Digital Product Passport requirements and the standards EN 18216–1822… | any of “Not relevant for us” | -2 |

Shaped by: q190, q184, q188

### Role-based passport views (`dppviews`)

A public part for everyone, restricted parts for repairers, recyclers and authorities — and who may update.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q195 | Which information in the passport must be restricted, and for whom? | any of “Material composition and suppliers (trade secrets)”, “Repair and disassembly instructions — authorised parties only”, “Carbon footprint and its calculation basis”, “Usage and failure data from the field”, “Personal data about the owner or user” | +2 |
| q191 | Who should be able to update the passport after the product has been sold? | any of “The manufacturer plus authorised repairers and reuse operators”, “Any lifecycle actor with a verified identity”, “Also agents acting for authorised actors” | +1 |
| q15 | How important is fine-grained, role-based access control? | rated ≥ 4 | +1 |

Shaped by: q195, q191

### Data carriers and link resolution (`carrier`)

Generating and resolving QR, Data Matrix, NFC or RFID with GS1 Digital Link or IEC 61406 — even when the mark is worn.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q186 | Which data carriers are realistic on your products? | any of “QR code”, “Data Matrix”, “NFC”, “UHF RFID” | +2 |
| q183 | Which identifier scheme do you use or plan for the product passport? | any of “GS1 (GTIN with serial number, GS1 Digital Link)”, “Self-issued identification link under IEC 61406” | +1 |
| q187 | How demanding is it to mark your products so the data carrier stays readable through the whole lifecycle — inc… | rated ≥ 4 | +1 |
| q25 | Which identifiers should link information across the lifecycle and across organisations? | any of “Physical tag ID (QR, data matrix, RFID, NFC)” | +1 |

Shaped by: q186

### Regulatory reporting and declarations (`reporting`)

Ready extracts and drafts for CSRD, RoHS, REACH/SCIP, WEEE and the product passport, traceable back to the underlying data.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q55 | Which AI-supported capabilities would create the most value for your organisation? | any of “Drafting compliance and sustainability reports (ESPR, CSRD, RoHS, REACH, WEEE)” | +2 |
| q117 | Who requires footprint data from you today, or is expected to? | any of “CSRD / sustainability reporting”, “ESPR and the Digital Product Passport” | +1 |
| q122 | Which sustainability decisions should the platform actively support? | any of “Producing reports ready for customers or regulators” | +1 |
| q23 | Which systems or data sources should be connected? | any of “Material-declaration systems (IPC-1752A, IMDS, SCIP)”, “Compliance and reporting systems” | +1 |
| q75 | Besides the circularity outcomes you named at the start, which measurable outcome would be most valuable to de… | any of “Lower compliance and reporting effort” | +1 |
| q10 | Which circularity outcomes matter most to your organisation? | any of “Regulatory compliance (ESPR, Digital Product Passport, WEEE, RoHS, REACH, CSRD)” | +1 |

## Sustainability

### Footprint per product or batch (`footprint`)

Calculates and carries the carbon footprint at product, batch or serial-number level, and exchanges it in PACT format.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q114 | At what level would it realistically be possible to record footprint data in your operations? | any of “Per production order or batch”, “Per individual product or serial number”, “Per process step” | +2 |
| q119 | How important is it that the footprint follows the product through its life — attached to the serial number an… | rated ≥ 4 | +2 |
| q116 | How important is it to move from industry averages and secondary data to measured primary data per product or … | rated ≥ 4 | +1 |
| q118 | Which footprint methods or standards do you use, or expect to have to use? | any of “ISO 14067 / GHG Protocol Product Standard (PCF)”, “PACT- or Catena-X-style PCF data exchange” | +1 |
| q55 | Which AI-supported capabilities would create the most value for your organisation? | any of “Estimating carbon, energy and material footprints” | +1 |
| q73 | Which area should receive the highest priority? | any of “Sustainability and carbon footprint” | +1 |

Shaped by: q114, q118, q125

### Verifiable sustainability claims (`claims`)

Footprint and recycled-content claims can be audited: basis, method and who has assured them.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q121 | How important is verifiability — that footprint figures in the platform can be audited or third-party assured … | rated ≥ 4 | +2 |
| q47 | If some form of tamper-evidence is needed, which data would justify it? | any of “Carbon, energy and footprint claims”, “Recycled-content claims” | +1 |
| q122 | Which sustainability decisions should the platform actively support? | any of “Substantiating recycled-content and footprint claims to customers” | +1 |
| q127 | Which of these developments do you consider plausible by 2035? | any of “A scandal over falsified sustainability data destroys trust in such claims” | +1 |

### Decision support for circular choices (`decisions`)

Compares designs, suppliers and repair versus replacement on footprint and cost, and finds the largest emission hotspots.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q122 | Which sustainability decisions should the platform actively support? | ≥ 2 selected (of listed options) | +2 |
| q122 | Which sustainability decisions should the platform actively support? | any of “Comparing design alternatives on footprint before the choice is made”, “Choosing supplier or material on footprint, not only price”, “Showing whether repair or refurbishment beats replacement for a specific unit” | +1 |
| q55 | Which AI-supported capabilities would create the most value for your organisation? | any of “Recommending repair, reuse, remanufacture or recycle for a given item” | +1 |

Shaped by: q122

### The platform's own energy and carbon accounting (`greenops`)

Measures and shows the energy use of the platform and its agents, runs heavy computation when power is clean, and sets energy budgets.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q177 | How concerned are you about the energy use and carbon footprint of AI, data centres and data sharing — weighed… | rated ≥ 4 | +2 |
| q178 | Which measures should govern the data volume and energy use of the platform and its agents? | any of “Run heavy computation where and when renewable power is available”, “Energy budget per service or agent”, “Show the footprint to the user before heavy operations”, “Report the platform’s own energy and carbon footprint to participants” | +1 |
| q178 | Which measures should govern the data volume and energy use of the platform and its agents? | ≥ 3 selected (of listed options) | +1 |
| q178 | Which measures should govern the data volume and energy use of the platform and its agents? | any of “No special considerations — the gains are far larger” | -2 |

Shaped by: q178

### Data minimisation and retention rules (`retention`)

Rules for what is stored, for how long and at what resolution — with automatic deletion and aggregation.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q178 | Which measures should govern the data volume and energy use of the platform and its agents? | any of “Avoid unnecessary storage and duplicated data”, “Keep raw sensor data for a limited period and retain aggregates”, “Limit retention of video and images”, “Delete derived data that is no longer used”, “Purpose limitation — collect only data with a defined use” | +2 |
| q17 | Which restrictions or governance requirements must be considered? | any of “Retention and deletion requirements” | +1 |
| q136 | Which properties must be built in from the start for the platform to withstand such changes? | any of “Data minimisation — store as little as possible for as long as it is useful” | +1 |
| q157 | Which consequences of growing data volume concern you most? | any of “Cost of storage, transfer and compute”, “Regulatory exposure (retention, deletion, privacy)” | +1 |

Shaped by: q40

## AI, agents and models

### Natural-language search and Q&A (`nlq`)

Ask about products, materials and events in plain language, with answers that show which data they rest on.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q55 | Which AI-supported capabilities would create the most value for your organisation? | any of “Natural-language search and question answering across lifecycle data” | +2 |
| q55 | Which AI-supported capabilities would create the most value for your organisation? | any of “Generating dashboards, reports or small applications on demand” | +1 |
| q75 | Besides the circularity outcomes you named at the start, which measurable outcome would be most valuable to de… | any of “Faster access to data” | +1 |
| q11 | Which data-quality problems do you experience most often? | any of “Data exists but we are not allowed to access it” | +1 |

### Agent interface with autonomy levels (`agentgw`)

A controlled interface (e.g. MCP) where agents read and propose, and write only within the autonomy level the owner has set.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q58 | What level of autonomy should AI agents have on the platform? | any of “Read-only — agents may analyse and suggest, humans write”, “Agents may draft changes that a human must approve before they take effect”, “Agents may write non-critical or derived fields autonomously and escalate the rest”, “Fully autonomous within clearly defined rules and audit”, “Depends on the data — see comment field” | +2 |
| q61 | How should applications and agents access the platform? | any of “Agent-oriented interface such as MCP” | +2 |
| q56 | Consider an agent that maintains a product’s Digital Product Passport — updating it automatically as repairs, … | rated ≥ 4 | +1 |
| q59 | What conditions must be met before you would allow an AI agent to access your data? | any of “Human approval before anything is shared externally” | +1 |
| q161 | Beyond the platform-wide trust mechanisms asked about earlier, what else must be in place for you to trust dat… | any of “Human approval above set thresholds (value, risk, anomalies)” | +1 |
| q58 | What level of autonomy should AI agents have on the platform? | any of “No agent access at all” | -4 |
| q59 | What conditions must be met before you would allow an AI agent to access your data? | any of “We would not allow agent access under any conditions” | -4 |

Shaped by: q58, q59

### Agent safeguards: identity, quotas, monitoring and kill switch (`agentguard`)

Every agent has its own identity and budget, its behaviour is monitored, and it can be stopped at once.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q160 | How important is it to be able to limit how much data and how many requests an agent can generate (quotas, bud… | rated ≥ 4 | +2 |
| q163 | Which mechanisms for trust and control should the platform support? | any of “Sandbox and simulation before agents get write access”, “Continuous monitoring and anomaly detection on agent behaviour”, “Kill switch that stops an agent or integration immediately” | +2 |
| q161 | Beyond the platform-wide trust mechanisms asked about earlier, what else must be in place for you to trust dat… | any of “Verifiable identity for each individual agent”, “Ability to check and reproduce the agent’s result” | +1 |
| q157 | Which consequences of growing data volume concern you most? | any of “Agents amplifying each other’s errors in chains (cascading failures)”, “People not keeping up with checking what agents do” | +1 |
| q155 | And in five years — when agents query, negotiate, confirm and update data on behalf of organisations? | rated ≥ 4 | +1 |

### Analytics for reuse, lifetime and root cause (`analytics`)

Remaining life, reuse value, sorting and root cause across production, test and field data.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q55 | Which AI-supported capabilities would create the most value for your organisation? | any of “Root-cause analysis across production, test and field data”, “Predicting remaining useful life and reuse potential of products or components”, “Grading, sorting and triage support at end-of-life (vision plus test data)”, “Recommending repair, reuse, remanufacture or recycle for a given item” | +2 |
| q71 | What data would you need to receive from others to work more circularly? | any of “Usage, load and condition data from operation”, “Repair and maintenance history”, “Failure and warranty data” | +1 |
| q10 | Which circularity outcomes matter most to your organisation? | any of “Repair and lifetime extension”, “Reuse of products”, “Reuse or harvesting of components”, “Refurbishment / remanufacturing”, “Warranty, returns and failure analysis” | +1 |
| q75 | Besides the circularity outcomes you named at the start, which measurable outcome would be most valuable to de… | any of “Faster root-cause analysis”, “Improved product quality” | +1 |

Shaped by: q55

### Running self-updating models and twins (`models`)

A model registry with versions, data basis, uncertainty, validation before changes go live — and the ability to roll back.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q219 | Do you have mathematical or physics-based models that can continuously update themselves as new data arrives? | any of “Yes, in operation — the models calibrate automatically against new data”, “Yes, but they are updated manually or periodically”, “No, but we would like to” | +2 |
| q223 | Which data would the models need from the platform to stay current? | ≥ 2 selected | +1 |
| q224 | What must be in place for you to trust a model that changes itself? | ≥ 2 selected | +1 |
| q225 | Who should own and run such models on a shared platform? | any of “Shared industry models, run by a neutral party”, “Models as a service from the platform” | +1 |
| q219 | Do you have mathematical or physics-based models that can continuously update themselves as new data arrives? | any of “No, and it is not relevant” | -2 |

Shaped by: q220, q223

### Transparency of models and algorithms (`transparency`)

Explanations of individual decisions, model cards, and the ability to test with one's own data before use.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q174 | How much of a concern are “black boxes” in the value chain — AI models, algorithms, firmware and components yo… | rated ≥ 4 | +2 |
| q176 | What would make a “black box” acceptable to you? | any of “An explanation of each individual decision”, “Being able to test it with our own data before use”, “Documentation of training data and limitations (model cards)”, “A human in the loop for important decisions” | +1 |
| q59 | What conditions must be met before you would allow an AI agent to access your data? | any of “Explainable and reproducible behaviour” | +1 |
| q175 | Where is lack of transparency most problematic? | any of “AI models that make recommendations or decisions”, “The training data behind AI models” | +1 |

Shaped by: q176

## Operations, sharing and automation

### Sharing with partners in the value chain (`sharing`)

Give selected partners access to specific data — and receive what you need from them — without sending files.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q69 | With whom might data need to be shared? | ≥ 2 selected (of listed options) | +2 |
| q71 | What data would you need to receive from others to work more circularly? | ≥ 2 selected | +1 |
| q73 | Which area should receive the highest priority? | any of “Cross-company data sharing” | +1 |
| q69 | With whom might data need to be shared? | any of “No external sharing” | -2 |

Shaped by: q69, q71

### Support for unattended operation (`unattended`)

A live view from outside, alerting, automatic stop rules and a complete event trail of what happened with nobody present.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q143 | How far towards unattended operation is it realistic for you to go? | any of “A whole shift can run unattended with supervision from a distance”, “Nights and weekends can run unattended as normal operation”, “Continuous operation without people, staffed only for maintenance and exceptions”, “We already do this today” | +2 |
| q146 | What must the data platform deliver when nobody is in the building? | ≥ 2 selected | +2 |
| q148 | How important is it that a unit produced or processed unsupervised can be documented as well as one an operato… | rated ≥ 4 | +1 |
| q143 | How far towards unattended operation is it realistic for you to go? | any of “Not relevant — everything requires people present” | -2 |

Shaped by: q146, q147

### First-person capture with consent and anonymisation (`capture`)

Recordings from glasses or cameras processed on the device or locally, with consent, redaction and a link to the product.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q86 | Which methods of capturing how the work is actually done would be acceptable in your organisation? | any of “Head-mounted camera or smart glasses — first-person video”, “AR glasses that both guide and record”, “Spoken narration by the worker while working” | +2 |
| q89 | How important is it that knowledge derived from capture is linked to the product, component or process it conc… | rated ≥ 4 | +1 |
| q88 | How valuable would an AI assistant be that has learned from recorded expert work and guides a less experienced… | rated ≥ 4 | +1 |
| q87 | Where would first-person (egocentric) data create the most value? | ≥ 1 selected (of listed options) | +1 |
| q86 | Which methods of capturing how the work is actually done would be acceptable in your organisation? | any of “None of these are acceptable” | -2 |

Shaped by: q93, q94

### Data for and from robots (`robots`)

Product data robots need to handle new variants (geometry, fasteners, disassembly sequence) — and the robots' process data back.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q108 | How important is it that robots deliver their process data (cycle times, forces, rejects, images) into the sha… | rated ≥ 4 | +2 |
| q109 | What data would a robot need from the platform to handle a product it has not seen before? | ≥ 2 selected (of listed options) | +2 |
| q101 | How important is automation for making reuse, repair and recycling economically viable in a high-wage country? | rated ≥ 4 | +1 |
| q110 | How important is it that robot programs or skills can be derived from recorded human work (learning from demon… | rated ≥ 4 | +1 |

Shaped by: q109

### Open-source core (`opencore`)

The core is delivered as open source with a clear licence and European governance, with professional support available.

| Q | Question | Condition | Weight |
|---|---|---|---|
| q208 | What is your stance on open source in the platform? | any of “Required — the core must be open source” | +4 |
| q208 | What is your stance on open source in the platform? | any of “Preferred, but not required” | +2 |
| q209 | What matters most to you about open source? | any of “Avoiding lock-in”, “Being able to inspect and audit the code”, “Being able to adapt it ourselves” | +1 |
| q210 | What is the right route to such a platform for you? | any of “Adopt and adapt open source” | +1 |
| q208 | What is your stance on open source in the platform? | any of “We avoid open source” | -3 |

Shaped by: q209
