# Prescription Portal

A host application that composes independently released frontends from several
teams. The first of them lets staff look up prescriptions.

## Composition

**Shell**:
The host application. It owns the global layout and navigation and mounts Remotes under routes.
_Avoid_: Host app, container, portal app

**Remote**:
A frontend that a team builds and releases on its own and the Shell mounts at runtime under a route.
_Avoid_: Micro frontend app, module, plugin, child app

**Remote Manifest**:
The Shell's runtime list of Remotes: for each, where to load it from, the route it is mounted under and its navigation label.
_Avoid_: Registry, remote config

**Standalone Harness**:
A minimal stand-in for the Shell that a Remote's team runs to use the Remote on its own.
_Avoid_: Sandbox app, dev shell

## Prescriptions

**Prescription**:
A medication prescribed to one Insurant on one Prescription Date.
_Avoid_: Order, script, Rx

**Insurant**:
The insured person a Prescription is issued to, identified by an Insurant ID.
_Avoid_: Patient, customer, member

**Insurant ID**:
The identifier of an Insurant at their health insurer.
_Avoid_: Patient number, member ID, KVNR

**Medication**:
The drug named on a Prescription.
_Avoid_: Drug, medicine, product

**Prescription Date**:
The day a Prescription was issued.
_Avoid_: Created date, issue date

## Finding prescriptions

**Search**:
Free text matched, case-insensitively and as a substring, against Medication name, Insurant name and Insurant ID.
_Avoid_: Query, lookup

**Filter**:
An exact constraint on one field: an Insurant ID, or a Prescription Date range with inclusive bounds.
_Avoid_: Search criterion, facet

**Page**:
One slice of the matching Prescriptions, given by a page number and a page size, together with the total number of matches.
_Avoid_: Chunk, batch
