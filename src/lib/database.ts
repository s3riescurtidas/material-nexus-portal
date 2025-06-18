// Database utilities for local storage using IndexedDB
interface DBMaterial {
  id: number;
  name: string;
  manufacturer: string;
  category: string;
  subcategory: string;
  description: string;
  evaluations: DBEvaluation[];
  createdAt: string;
  updatedAt: string;
}

interface DBProject {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  materials: DBProjectMaterial[];
  createdAt: string;
  updatedAt: string;
}

interface DBProjectMaterial {
  id: string;
  name: string;
  manufacturer: string;
  quantity_m2?: number;
  quantity_m3?: number;
  units?: number;
}

interface DBEvaluation {
  id: number;
  type: string;
  version: string;
  issueDate: string;
  validTo: string;
  conformity: number;
  geographicArea: string;
  fileName?: string;
  [key: string]: any; // For specific evaluation type fields
}

interface DBConfig {
  manufacturers: string[];
  categories: string[];
  subcategories: Record<string, string[]>;
  evaluationTypes: string[];
}

class LocalDatabase {
  private dbName = 'MaterialsDatabase';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create materials store
        if (!db.objectStoreNames.contains('materials')) {
          const materialsStore = db.createObjectStore('materials', { keyPath: 'id', autoIncrement: true });
          materialsStore.createIndex('name', 'name', { unique: false });
          materialsStore.createIndex('manufacturer', 'manufacturer', { unique: false });
          materialsStore.createIndex('category', 'category', { unique: false });
        }

        // Create projects store
        if (!db.objectStoreNames.contains('projects')) {
          const projectsStore = db.createObjectStore('projects', { keyPath: 'id', autoIncrement: true });
          projectsStore.createIndex('name', 'name', { unique: false });
        }

        // Create config store
        if (!db.objectStoreNames.contains('config')) {
          db.createObjectStore('config', { keyPath: 'key' });
        }

        // Create files store for evaluation documents
        if (!db.objectStoreNames.contains('files')) {
          const filesStore = db.createObjectStore('files', { keyPath: 'id' });
          filesStore.createIndex('materialId', 'materialId', { unique: false });
          filesStore.createIndex('evaluationType', 'evaluationType', { unique: false });
        }
      };
    });
  }

  async addMaterial(material: Omit<DBMaterial, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const now = new Date().toISOString();
    const materialWithTimestamps = {
      ...material,
      createdAt: now,
      updatedAt: now
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['materials'], 'readwrite');
      const store = transaction.objectStore('materials');
      const request = store.add(materialWithTimestamps);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async updateMaterial(material: DBMaterial): Promise<void> {
    const updatedMaterial = {
      ...material,
      updatedAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['materials'], 'readwrite');
      const store = transaction.objectStore('materials');
      const request = store.put(updatedMaterial);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getMaterials(): Promise<DBMaterial[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['materials'], 'readonly');
      const store = transaction.objectStore('materials');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteMaterial(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['materials'], 'readwrite');
      const store = transaction.objectStore('materials');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async addProject(project: Omit<DBProject, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const now = new Date().toISOString();
    const projectWithTimestamps = {
      ...project,
      createdAt: now,
      updatedAt: now
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      const request = store.add(projectWithTimestamps);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async updateProject(project: DBProject): Promise<void> {
    const updatedProject = {
      ...project,
      updatedAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      const request = store.put(updatedProject);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getProjects(): Promise<DBProject[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteProject(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async saveConfig(config: DBConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['config'], 'readwrite');
      const store = transaction.objectStore('config');
      const request = store.put({ key: 'main', ...config });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getConfig(): Promise<DBConfig> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['config'], 'readonly');
      const store = transaction.objectStore('config');
      const request = store.get('main');

      request.onsuccess = () => {
        if (request.result) {
          const { key, ...config } = request.result;
          resolve(config);
        } else {
          resolve(this.getDefaultConfig());
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveFile(materialId: number, evaluationType: string, version: string, file: File): Promise<string> {
    const fileId = `${materialId}${evaluationType}v${version}`;
    const fileData = {
      id: fileId,
      materialId,
      evaluationType,
      version,
      fileName: `${fileId}.${file.name.split('.').pop()}`,
      content: await file.arrayBuffer(),
      mimeType: file.type,
      uploadedAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readwrite');
      const store = transaction.objectStore('files');
      const request = store.put(fileData);

      request.onsuccess = () => resolve(fileData.fileName);
      request.onerror = () => reject(request.error);
    });
  }

  async getFile(fileId: string): Promise<Blob | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      const request = store.get(fileId);

      request.onsuccess = () => {
        if (request.result) {
          const blob = new Blob([request.result.content], { type: request.result.mimeType });
          resolve(blob);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  private getDefaultConfig(): DBConfig {
    return {
      manufacturers: ["Madeiras & madeira", "Amorim Cimentos", "Test Manufacturer", "Silva Wood Industries", "EcoMaterials Ltd", "GreenBuild Corp"],
      categories: ["Wood", "Concrete", "Metal", "Glass", "Plastic", "Ceramic"],
      subcategories: {
        "Wood": ["Treated Wood", "Natural Wood", "Laminated Wood", "Engineered Wood", "Bamboo"],
        "Concrete": ["Standard Concrete", "High Performance Concrete", "Lightweight Concrete", "Precast Concrete"],
        "Metal": ["Steel", "Aluminum", "Copper", "Iron", "Titanium"],
        "Glass": ["Standard Glass", "Tempered Glass", "Laminated Glass", "Double Glazed"],
        "Plastic": ["PVC", "Polyethylene", "Polypropylene", "Acrylic"],
        "Ceramic": ["Floor Tiles", "Wall Tiles", "Porcelain", "Terracotta"]
      },
      evaluationTypes: [
        "EPD", "LCA", "Manufacturer Inventory", "REACH Optimization",
        "Health Product Declaration", "C2C", "Declare", "Product Circularity",
        "Global Green Tag Product Health Declaration", "FSC / PEFC", "ECOLABEL"
      ]
    };
  }
}

export const localDB = new LocalDatabase();
