https://gist.github.com/jsvine/9cb3300588ed402160fe

curl http://armstrade.sipri.org/armstrade/html/export_trade_register.php --compressed \
    --data 'low_year=2015' \
    --data 'high_year=2015' \
    --data 'seller_country_code=' \
    --data 'buyer_country_code=' \
    --data 'armament_category_id=any' \
    --data 'buyers_or_sellers=sellers' \
    --data 'filetype=csv' \
    --data 'include_open_deals=on' \
    --data 'sum_deliveries=on' \
    --data 'Submit4=Download' \
> sipri-arms-by-seller-2015.csv


curl http://armstrade.sipri.org/armstrade/html/export_trade_register.php --compressed \
    --data 'low_year=2015' \
    --data 'high_year=2015' \
    --data 'seller_country_code=' \
    --data 'buyer_country_code=' \
    --data 'armament_category_id=any' \
    --data 'buyers_or_sellers=buyer' \
    --data 'filetype=csv' \
    --data 'include_open_deals=on' \
    --data 'sum_deliveries=on' \
    --data 'Submit4=Download' \
> sipri-arms-by-buyer-2015.csv