# Extends pas 

## Provider

Provider adds functionality to acquire package from external project.

## Profile

Profile adds functionality to build your package in specific way

To create new profile, you have to implements method:

### #read()

If your profile does not have to provide pas.json, then your profile have to
read it independently from the profile native file, or the profile can compose the manifest.

### #install()

Implement install to your profile, otherwise it will not doing anything while installing
