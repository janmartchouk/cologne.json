curl -s -R -A "Mozilla/5.0" https://www.kvb.koeln/fahrtinfo/betriebslage/index.html > page.html
echo "//download.sh: downloaded html"
iconv -f ISO-8859-1 -t UTF-8 page.html -o page.html
echo "//download.sh: converted to utf-8"
