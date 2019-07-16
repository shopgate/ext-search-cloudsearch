# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) and this project adheres to [Semantic Versioning](http://semver.org/).

## [1.1.2]
### Fixed
- increased the minimal query length for suggestions from 2 to 3 and checking it again AFTER removing invalid characters
- only requesting 10 suggestions from cloudsearch instead of 100 (the remaining 90 were discarded anyway)

## [1.1.1]
### Fixed
- add optional characteristics input to all getProducts* pipelines.


## [1.1.0]
### Added
- updated query builder to behave same as in legacy CloudSearch implementation.
