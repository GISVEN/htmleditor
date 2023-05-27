<?php

include "TaskClass.php";

//function slash_at_the_end(string $path): bool {
//    $last_char = substr($path, -1);
//    return $last_char == '/';
//}

function slash_at_the_end(string $path): bool {
    return substr_compare($path, '/', -1) === 0;
}

function check_dir(string $tasks_folder_path): void
{
    if (!is_dir($tasks_folder_path)) {
        // Handle error case
        echo "Invalid tasks folder path: " . $tasks_folder_path;
        exit();
    }
}
function get_one_task(string $tasks_folder_path): Generator
{

    $dir_scan = scandir($tasks_folder_path);
    // add slash
    if (!slash_at_the_end($tasks_folder_path)) $tasks_folder_path .= '/';

    foreach ($dir_scan as $item) {
        // skip back buttons
        if ($item == '.' or $item == '..') continue;
        // create full file path
        $file_path = $tasks_folder_path.$item;
        $file_content = file_get_contents($file_path);
        $file_content_decoded = json_decode($file_content, true);
        yield new TaskClass(
            $file_content_decoded["name"],
            $file_content_decoded["start"],
            $file_content_decoded["description"],
            $file_content_decoded["answers"],
            $file_content_decoded["final"]
        );
    }


}

function get_all_tasks($tasks_folder_path): array
{
    check_dir($tasks_folder_path);
    $result = [];
    foreach (get_one_task($tasks_folder_path) as $task) {
        $result[] = $task;
    }
    return $result;
}
