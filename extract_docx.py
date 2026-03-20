import zipfile
import xml.etree.ElementTree as ET
import os

def extract_text(docx_path):
    document = zipfile.ZipFile(docx_path)
    xml_content = document.read('word/document.xml')
    document.close()
    
    tree = ET.fromstring(xml_content)
    text = ""
    # XML namespace for Word
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    
    for paragraph in tree.iterfind('.//w:p', ns):
        for run in paragraph.iterfind('.//w:t', ns):
            if run.text:
                text += run.text
        text += '\n'
    return text

if __name__ == "__main__":
    file_path = 'Especificaciones Tecnicas gestion valvulas.docx'
    if os.path.exists(file_path):
        content = extract_text(file_path)
        with open('especificaciones_text.txt', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Text extracted successfully to especificaciones_text.txt")
    else:
        print(f"File {file_path} not found.")
