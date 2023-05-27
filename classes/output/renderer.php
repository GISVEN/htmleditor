<?php

namespace mod_htmleditor\output;

use plugin_renderer_base;

class renderer extends plugin_renderer_base {
    public function main_action_bar(standard_action_bar $actionmenu) {
        return $this->render($actionmenu);
    }
}