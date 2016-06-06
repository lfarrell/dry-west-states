<?php
$files = scandir('data/full');

$headers = ['year','value','anomaly','month','state','type'];
$fh = fopen('data/all.csv', 'wb');
fputcsv($fh, $headers);

$ft = fopen('data/all_2000.csv', 'wb');
fputcsv($ft, $headers);

foreach($files as $file) {
    if(!is_dir($file)) {
        $state = preg_split('/\./', $file)[0];
        $fg = fopen("data/no-max-min/$state" . ".csv", "wb");

        if (($handle = fopen("data/full/$file", "r")) !== FALSE) {
            while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
                if(!preg_match('/(max|min)/', $data[5])) {
                    fputcsv($fg, $data);

                    if(!preg_match('/^[a-zA-Z]/', $data[0])) {
                        fputcsv($fh, $data);

                        if($data[0] >= 2000) {
                            fputcsv($ft, $data);
                        }
                    }
                }
            }
            fclose($handle);
        }
        fclose($fg);
    }

    echo "$file processed\n";
}
fclose($fh);
fclose($ft);