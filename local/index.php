<?php

include "TaskParserDir/TasksParser.php";

$config = json_decode(file_get_contents("./glob_config.json"), true);

$tasks = get_all_tasks($config['tasks_directory_path']);

echo "<style> 
.border {
    border: black 1px solid;
}
.padding {
    padding: 4px;
}
.margin {
    margin: 4px;
}
.no_margin {
    margin: 0;
}
</style>";

echo "<label for='tasks_list'>Tasks list:</label>";
foreach ($tasks as $task) {
    $array = (array) $task;
    $encoded = json_encode($array);
    echo "<form id='tasks_list' class='border no_margin' action='Task.php' method='post'>";
    echo "<input type='hidden' name='task' value='$encoded' />";
    echo "<button class='margin'>$task->name</button><br/>";
    echo "</form>";
}

echo "</form>";
