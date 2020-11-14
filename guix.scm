;;; Compa --- Worldwide social directory decentralized and federated
;;; Copyright (C) 2017 Distopico <distopico@riseup.net>
;;;
;;; This file is part of Compa.
;;;
;;; Compa is free software: you can redistribute it and/or modify
;;; it under the terms of the GNU Affero General Public License as
;;; published by the Free Software Foundation, either version 3 of the
;;; License, or (at your option) any later version.
;;;
;;; Compa is distributed in the hope that it will be useful,
;;; but WITHOUT ANY WARRANTY; without even the implied warranty of
;;; MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
;;; GNU Affero General Public License for more details.
;;;
;;; You should have received a copy of the GNU Affero General Public License
;;; along with Compa. If not, see <http://www.gnu.org/licenses/>.

;;; Commentary:
;;
;; GNU Guix development package.  To build and install, run:
;;
;;   guix package -f guix.scm
;;
;; To build it, but not install it, run:
;;
;;   guix build -f guix.scm
;;
;; To use as the basis for a development environment, run:
;;
;;   guix environment -l guix.scm
;;
;;; Code:

(use-modules
  (guix packages)
  ((guix licenses) #:prefix license:)
  (guix download)
  (guix git-download)
  (guix build-system gnu)
  (gnu packages)
  (gnu packages autotools)
  (gnu packages guile)
  (gnu packages guile-xyz)
  (gnu packages pkg-config)
  (gnu packages texinfo))

(define *srcdir* (canonicalize-path (current-source-directory)))

(package
  (name "compa")
  (version "0.1")
  (source (local-file *srcdir* #:recursive? #t #:select? (git-predicate *srcdir*)))
  (build-system gnu-build-system)
  (arguments `())
  (native-inputs
    `(("autoconf" ,autoconf)
      ("automake" ,automake)
      ("pkg-config" ,pkg-config)
      ("texinfo" ,texinfo)))
  (inputs `(("guile" ,guile-3.0)))
  (propagated-inputs
   `(("guile-commonmark" ,guile-commonmark)))
  (synopsis "Worldwide social directory decentralized and federated")
  (description "Compa is a free (as freedom) world wide social directory decentralized and federated with an ActivityPub API.")
  (home-page "http://joincompa.org/")
  (license license:agpl3+))
