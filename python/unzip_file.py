import zipfile

def unzip_file(file_path):
    with zipfile.ZipFile(file_path, "r") as zip_file:
        # Unzip to the parent of the file path
        zip_file.extractall(file_path.parent)
        return file_path.parent