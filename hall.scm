(hall-description
  (name "compa")
  (prefix "")
  (version "0.1")
  (author "Distopico")
  (copyright (2020))
  (synopsis "")
  (description "")
  (home-page "")
  (license gpl3+)
  (dependencies `())
  (files (libraries
           ((directory
              "compa"
              ((directory "cli" ((text-file ".gitkeep")))
               (directory "server" ((scheme-file "compa")))))))
         (tests ((directory "server" ((scheme-file "compa")))))
         (programs ((directory "scripts" ())))
         (documentation
           ((symlink "README" "README.md")
            (text-file "HACKING")
            (text-file "COPYING")
            (directory "doc" ((texi-file "compa")))
            (text-file "AUTHORS")))
         (infrastructure
           ((scheme-file "guix") (scheme-file "hall")))))
