import os
import re
from bs4 import BeautifulSoup
from app import app, db, Camera

def extract_cameras_from_html():
    """Extract camera data from the index.html file"""
    with open('index.html', 'r', encoding='utf-8') as file:
        html_content = file.read()
    
    soup = BeautifulSoup(html_content, 'html.parser')
    cameras = []
    
    # Extract Moscow cameras
    moscow_list = soup.select_one('#moscow-cameras')
    if moscow_list:
        for li in moscow_list.find_all('li'):
            cameras.append({
                'name': li.text.strip(),
                'url': li.get('data-url', ''),
                'is_video': not (li.get('data-url', '').endswith(('.jpg', '.jpeg', '.png', '.gif')) or '/poster/' in li.get('data-url', '')),
                'district': 'Центральный' if 'Москва' in li.text else 'Москва'
            })
    
    # Extract Dagestan cameras
    dagestan_list = soup.select_one('#dagestan-cameras')
    if dagestan_list:
        for li in dagestan_list.find_all('li'):
            cameras.append({
                'name': li.text.strip(),
                'url': li.get('data-url', ''),
                'is_video': not (li.get('data-url', '').endswith(('.jpg', '.jpeg', '.png', '.gif')) or '/poster/' in li.get('data-url', '')),
                'district': 'Дагестан'
            })
    
    # Extract Other cameras
    other_list = soup.select_one('#other-cameras')
    if other_list:
        for li in other_list.find_all('li'):
            name = li.text.strip()
            district = name.split()[0] if ' ' in name else 'Другое'
            cameras.append({
                'name': name,
                'url': li.get('data-url', ''),
                'is_video': not (li.get('data-url', '').endswith(('.jpg', '.jpeg', '.png', '.gif')) or '/poster/' in li.get('data-url', '')),
                'district': district
            })
    
    return cameras

def migrate_data():
    """Import camera data from HTML to database"""
    # Create tables if they don't exist
    with app.app_context():
        db.create_all()
        
        # Check if we already have cameras in the DB
        if Camera.query.count() > 0:
            print("Database already contains cameras. Migration will be skipped.")
            return
        
        # Extract cameras from HTML
        cameras = extract_cameras_from_html()
        
        # Add cameras to database
        for camera_data in cameras:
            camera = Camera(
                name=camera_data['name'],
                url=camera_data['url'],
                is_video=camera_data['is_video'],
                district=camera_data['district']
            )
            db.session.add(camera)
        
        # Commit changes
        db.session.commit()
        print(f"Successfully migrated {len(cameras)} cameras to the database.")

if __name__ == "__main__":
    # Make sure BeautifulSoup is installed
    try:
        import bs4
    except ImportError:
        print("BeautifulSoup is not installed. Installing it now...")
        os.system('pip install beautifulsoup4')
        print("BeautifulSoup installed successfully.")
    
    migrate_data() 