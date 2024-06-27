# Firebase function notes

There is a real issue with getting firebase functions to work with all of 
 
  * ESM instead of CommonJS modules
  * typescript
  * jest
  * being embedded in a next.js project where the parent directory has a `node_modules` directory.

Firebase functions do not support parsing of modules w/o an extension. This messes up
typescript which expects to elide the extension so the module loader can infer the
.js in the compiled file.  Alternatively it is possible to explicitly write .js
everywhere but this breaks some other tooling.

To fix this, esbuild for creating a bundle in lib/index.js.

However this bundle CANNOT include packages from `node_modules` that are written
in CommonJS otherwise you end up with CommonJS syntax in a ESM context leading to
cryptic error messages about not being able to do a dynamic import or something.

To avoid that, it is required that the esbuild command to consider all `node_modules`
files to be external packages. This works because the firebase deploy environment
will do an npm install ensuring the packages exist on the local filesystem outside
the purview of the bundler.

Next up is ensuring that tsc does not go searching up the tree for `node_modules`
directories. By default tsc will search up from the source file. This means that
packages installed in the parent directory are implicitly accessible by things
in the functions directory.  Worse, if you import files from a relative path
like '../common/' then the imports  inside those files will look in the parent
`node_modules` and you will likely end up introducing two versions of common
packages which are type-incompatible.

To fix this, tsc must have the explicit entries for `typeRoots = ["./node_modules/@types"]`,
`baseUrl = "."`, and an entry in paths for ` "*": ["./node_modules/*"]` to force
the lookup into the local `node_modules` only an always regardless of relative path.
See the following comment for more details:
   https://github.com/microsoft/TypeScript/issues/30124#issuecomment-573084787

Alo jest needs to import the tsconfig.json and yank out bits so it knows how to
find the compiled binaries. It also needs to use `ts-jest` otherwise it will
default to babel and run the test but disable all the type checking.

Finally all this has implications for "watch" style targets as some combination
of tsc, esbuild, firebase emulators, and jest need to run in parallel in watch
mode.  This will cause a benign race in some cases, but the final product
should work.

Is this a mess? Yes it is.

*sigh*.
