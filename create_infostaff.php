<?php

fwrite(
    STDERR,
    "This insecure legacy account script has been disabled. Create receptionist accounts through the authenticated Admin > Staff workflow so temporary credentials expire and are audited.\n",
);

exit(1);
