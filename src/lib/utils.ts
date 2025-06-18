
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility function to clean invalid categories from database
export const cleanInvalidCategories = async (localDB: any) => {
  try {
    const config = await localDB.getConfig();
    
    // List of invalid categories to remove
    const invalidCategories = [
      'AAAAAAAAAAA',
      'ACategoria de teste', 
      'Categoriateste'
    ];
    
    // Filter out invalid categories
    const cleanCategories = config.categories.filter((cat: string) => 
      !invalidCategories.includes(cat)
    );
    
    // Clean subcategories for invalid categories
    const cleanSubcategories = { ...config.subcategories };
    invalidCategories.forEach(invalidCat => {
      delete cleanSubcategories[invalidCat];
    });
    
    // Update config with cleaned data
    const updatedConfig = {
      ...config,
      categories: cleanCategories,
      subcategories: cleanSubcategories
    };
    
    await localDB.saveConfig(updatedConfig);
    console.log('✅ Invalid categories cleaned:', invalidCategories);
    
    return updatedConfig;
  } catch (error) {
    console.error('❌ Error cleaning invalid categories:', error);
    throw error;
  }
};
