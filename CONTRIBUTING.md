# Contribution guide

It's great that you want to contribute to **Compa**! There are lots of ways to get involved.

## Code

There's always work to be done on the **Compa** codebase. Here are the basic rules:

* Write [good commit messages][commits]
* Make sure the linter (`npm run lint`) passes
* Make sure all tests (`npm test`) passes
* Send patches via Pull Request from your branch to `develop`
* See [HACKING][] for more guidelines

Need a more detailed explanation, or aren't sure how to start? See [CONTRIBUTING_CODE.md][].

## Design

Other way to contribute is with design, you can make contribution for better UI/UX in webapp,
or with design for promotional material etc, please feel free to propose, only  some basic things:

* All design pieces need release over [Creative Commons License By-SA][creativecommons]
* We'll need teh source file in a open format like `.svg`

## Issues

Found a problem in **compa**, or want to suggest an improvement? Reporting that to us is super useful.

If you've found a bug, include as much information as possible about the server:

* Hostname
* **compa** version
* Node.js version
* npm version
* The contents of `compa.json` (if you have access to that; make sure to redact secrets)
* The operating system
* Install method (source-based or npm-based)

If it's a bug in the web UI, please provide exact step-by-step instructions for reproducing it.

If it's a bug in the API, include details about what you're submitting or the exact URL that you're querying.

## This project is Free Software

**Compa** is [Free Software][freesoftware] and your code contributions will be released under the **GNU AGPL 3.0 License**,
See the [COPYING][LICENSE] file for the full license text.

[![GNU AGPLv3 Image](https://www.gnu.org/graphics/agplv3-88x31.png)](https://www.gnu.org/licenses/agpl-3.0.html)

 [commits]: https://chris.beams.io/posts/git-commit/
 [HACKING]: https://framagit.org/compa/compa/tree/master/HACKING
 [LICENSE]: https://framagit.org/compa/compa/tree/master/COPYING
 [CONTRIBUTING_CODE.md]: https://framagit.org/compa/compa/tree/master/doc/CONTRIBUTING_CODE.md
 [creativecommons]: https://creativecommons.org/choose/
 [community]: https://github.com/pump-io/pump.io/wiki/Community
 [freesoftware]: https://www.gnu.org/philosophy/free-sw.html
