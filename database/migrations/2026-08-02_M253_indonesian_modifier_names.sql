-- M-253 / BUG-2026-012: modifier group/option names were seeded in English
-- ("Sugar Level", "Less Sugar", "Ice Level", ...), inconsistent with the rest
-- of the Indonesian-language mobile app. Renaming the data in place — no
-- schema change, `modifier.name` / `modifier.group_name` are plain VARCHAR.

UPDATE `modifier` SET `group_name` = 'Tingkat Gula' WHERE `group_name` = 'Sugar Level';
UPDATE `modifier` SET `group_name` = 'Tingkat Es'   WHERE `group_name` = 'Ice Level';
UPDATE `modifier` SET `group_name` = 'Ukuran'       WHERE `group_name` = 'Size';
UPDATE `modifier` SET `group_name` = 'Tambahan'     WHERE `group_name` = 'Add-on';
UPDATE `modifier` SET `group_name` = 'Preferensi'   WHERE `group_name` = 'Preference';

UPDATE `modifier` SET `name` = 'Sedikit Gula'          WHERE `name` = 'Less Sugar';
UPDATE `modifier` SET `name` = 'Gula Normal'            WHERE `name` = 'Normal Sugar';
UPDATE `modifier` SET `name` = 'Gula Ekstra'            WHERE `name` = 'Extra Sugar';
UPDATE `modifier` SET `name` = 'Sedikit Es'             WHERE `name` = 'Less Ice';
UPDATE `modifier` SET `name` = 'Es Normal'              WHERE `name` = 'Normal Ice';
UPDATE `modifier` SET `name` = 'Tanpa Es'               WHERE `name` = 'No Ice';
UPDATE `modifier` SET `name` = 'Ukuran Besar'           WHERE `name` = 'Upsize Large';
UPDATE `modifier` SET `name` = 'Tambahan Shot Espresso'  WHERE `name` = 'Extra Espresso Shot';
UPDATE `modifier` SET `name` = 'Susu Oat'               WHERE `name` = 'Oat Milk';
UPDATE `modifier` SET `name` = 'Tambahan Saus Keju'      WHERE `name` = 'Extra Cheese Sauce';
UPDATE `modifier` SET `name` = 'Tanpa Daun Bawang'       WHERE `name` = 'No Spring Onion';
