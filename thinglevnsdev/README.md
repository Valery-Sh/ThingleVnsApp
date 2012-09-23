thingleplatform
===============

How to build
------------

First clone the main thingleplatform repository by running:

```bash
git clone git://github.com/thingle/thingleplatform.git
```

thingleplatform is built using the ./build script. The script performs the following operations:

- clean the dist/ folder
- minimize the js files (using requirejs optimizer)
- copy some files in the dist/ folder
- replace some text patterns with variables in files located in the dist/ folder

The build configuration is located in the public/public.build.js, config/config.build.js and public/js/app.build.js files.

Enter the directory and run the command:

```bash
./build
```

The built artifact will be put in a 'dist/' directory.

How to deploy
-------------

Before pushing to heroku, thingleplatform must be built, and the build artifact commited:

```bash
./build
git add dist
git commit -m 'Commit build artifact'
```

thingleplatform is deployed on heroku. The deployment step is done by pushing to the git repository of one of the following heroku apps:

- thingle (Production): git@heroku.com:thingle.git (recommended name for the remote: heroku)
- thingle-sandbox (Staging): git@heroku.com:thingle-sandbox.git (recommended name for the remote: sandbox)
- thingle-feature (Additional testing environment): git@heroku.com:thingle-feature.git (recommended name for the remote: feature)

Deploy the develop branch on the staging environment:

```bash
git push sandbox develop:master
```

### Using the deploy script

A deploy script automate the above commandes.

Build, add, commit and push the master branch to production:

```bash
./deploy heroku
```

Build, add, commit and push the develop branch to sandbox:

```bash
./deploy sandbox develop
```
