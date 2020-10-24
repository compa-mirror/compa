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
;; Main entry-point for compa server
;;
;;; Code:

(use-modules (web server))

(define port 8080)
(define host "127.0.0.1")

(define (create-server)
  `(display
    (string-append "Server running at http://" ,server-host ,port))
  (lambda (request request-body)
    (values '((content-type . (text/plain)))
            "Compa!")))

(run-server (create-server) 'http `(#:host ,host #:port ,port ))
