import glob
for f in glob.glob('frontend/*.html'):
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    content = content.replace('giao-dien.css?v=8', 'giao-dien.css?v=9').replace('dung-chung.js?v=2', 'dung-chung.js?v=3')
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
print("Done")
