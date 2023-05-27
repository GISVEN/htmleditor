<?php

echo "
<script src='ace-builds-master/src/ace.js'></script>
<script src='AcePlayground.js' type='module'></script>";

// TODO description window
// TODO task complete check

$task = json_decode($_POST['task']);
$name = $task->name;
$description = $task->description;
$start = $task->start;
$answers = $task->answers;
$final = $task->final;

$grid_templates_row = '70% 5% 25%';

echo "<style>
.description {
    background: white;
    border: black 2px solid;
    position: absolute;
    z-index: 10;
    width: 80%;
    height: 90%;
    padding: 5px;
} 

#root {
    width: 95%;
    height: 95%;
    
    display: grid;
    grid-template-areas: 'editor preview';
}
#editor {
    border: 1px solid black;
    grid-area: editor;
}
#preview {
    border: 1px solid black;
    grid-area: preview;
    display: grid;
    grid-template-areas: 'result' 'expand' 'description';
    grid-template-rows: $grid_templates_row;
}
#result {
    width: 99%;
    height: 98%;
    grid-area: result;
}
#description {
    width: 99%;
    height: 98%;
    grid-area: description;
}

</style>";



echo "
<div id='root'>
    <ace-playground 
        id='editor' html='$start' css='' 
        description='$description'></ace-playground>
    <div id='preview'>
        <iframe id='result'></iframe>
        <iframe id='description'></iframe>
    </div>
</div>
";

