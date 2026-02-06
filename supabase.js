// supabase.js - Клиент для работы с Supabase
console.log('🔧 Supabase.js загружается...');

// Конфигурация Supabase
const SUPABASE_CONFIG = {
  url: 'https://szwsvtxkhlacrarplgtn.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6d3N2dHhraGxhY3JhcnBsZ3RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxMzA1NjAsImV4cCI6MjA4MTcwNjU2MH0.dcRnrqlA4Iz1RthtFT7wL_KGorGz4lHnMMsWCP8i-ns',
  options: {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
};

// Создаем клиент
let supabaseClient;

try {
  if (typeof supabase !== 'undefined') {
    supabaseClient = supabase.createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.key,
      SUPABASE_CONFIG.options
    );
    console.log('✅ Supabase клиент создан');
  } else {
    throw new Error('Библиотека Supabase не загружена');
  }
} catch (error) {
  console.error('❌ Ошибка создания Supabase клиента:', error.message);
  createFallbackClient();
}

// Создание таблиц в Supabase при необходимости
async function initializeSupabaseTables() {
  console.log('📊 Инициализация таблиц Supabase...');
  
  if (!supabaseClient) return;
  
  try {
    // Проверяем существование таблиц
    const { data: tables, error } = await supabaseClient
      .from('pg_tables')
      .select('tablename')
      .ilike('schemaname', 'public');
    
    if (error) {
      console.log('Не удалось проверить таблицы:', error);
      return;
    }
    
    const existingTables = tables.map(t => t.tablename);
    console.log('Существующие таблицы:', existingTables);
    
    // Создаем недостающие таблицы через SQL запросы
    const sqlStatements = [];
    
    // Таблица для деревьев
    if (!existingTables.includes('family_trees')) {
      sqlStatements.push(`
        CREATE TABLE family_trees (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          cover_image_url TEXT,
          is_public BOOLEAN DEFAULT false,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
          settings JSONB DEFAULT '{}'::jsonb
        );
        
        CREATE INDEX idx_family_trees_user_id ON family_trees(user_id);
        CREATE INDEX idx_family_trees_created_at ON family_trees(created_at DESC);
      `);
    }
    
    // Таблица для людей
    if (!existingTables.includes('people')) {
      sqlStatements.push(`
        CREATE TABLE people (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          tree_id UUID REFERENCES family_trees(id) ON DELETE CASCADE,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          middle_name VARCHAR(100),
          maiden_name VARCHAR(100),
          birth_date DATE,
          birth_place VARCHAR(255),
          death_date DATE,
          death_place VARCHAR(255),
          gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other')),
          photo_url TEXT,
          biography TEXT,
          is_living BOOLEAN DEFAULT true,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
          metadata JSONB DEFAULT '{}'::jsonb
        );
        
        CREATE INDEX idx_people_tree_id ON people(tree_id);
        CREATE INDEX idx_people_user_id ON people(user_id);
        CREATE INDEX idx_people_names ON people(first_name, last_name);
      `);
    }
    
    // Таблица для связей между людьми
    if (!existingTables.includes('relationships')) {
      sqlStatements.push(`
        CREATE TABLE relationships (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          tree_id UUID REFERENCES family_trees(id) ON DELETE CASCADE,
          person1_id UUID REFERENCES people(id) ON DELETE CASCADE,
          person2_id UUID REFERENCES people(id) ON DELETE CASCADE,
          relationship_type VARCHAR(50) CHECK (relationship_type IN (
            'spouse', 'parent_child', 'sibling', 'grandparent_grandchild',
            'aunt_uncle_niece_nephew', 'cousin', 'other'
          )),
          start_date DATE,
          end_date DATE,
          notes TEXT,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
        );
        
        CREATE INDEX idx_relationships_tree_id ON relationships(tree_id);
        CREATE INDEX idx_relationships_person1 ON relationships(person1_id);
        CREATE INDEX idx_relationships_person2 ON relationships(person2_id);
        CREATE UNIQUE INDEX idx_relationships_unique ON relationships(tree_id, person1_id, person2_id, relationship_type);
      `);
    }
    
    // Таблица для медиа
    if (!existingTables.includes('media')) {
      sqlStatements.push(`
        CREATE TABLE media (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          tree_id UUID REFERENCES family_trees(id) ON DELETE CASCADE,
          person_id UUID REFERENCES people(id) ON DELETE SET NULL,
          file_url TEXT NOT NULL,
          file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('image', 'video', 'document', 'audio')),
          file_name VARCHAR(255),
          file_size INTEGER,
          description TEXT,
          tags TEXT[] DEFAULT '{}',
          is_public BOOLEAN DEFAULT false,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
        );
        
        CREATE INDEX idx_media_tree_id ON media(tree_id);
        CREATE INDEX idx_media_person_id ON media(person_id);
        CREATE INDEX idx_media_user_id ON media(user_id);
      `);
    }
    
    // Таблица для событий
    if (!existingTables.includes('events')) {
      sqlStatements.push(`
        CREATE TABLE events (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          tree_id UUID REFERENCES family_trees(id) ON DELETE CASCADE,
          person_id UUID REFERENCES people(id) ON DELETE CASCADE,
          title VARCHAR(255) NOT NULL,
          event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
            'birth', 'death', 'marriage', 'divorce', 'graduation',
            'military_service', 'immigration', 'award', 'other'
          )),
          event_date DATE NOT NULL,
          event_place VARCHAR(255),
          description TEXT,
          media_url TEXT,
          is_public BOOLEAN DEFAULT true,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
        );
        
        CREATE INDEX idx_events_tree_id ON events(tree_id);
        CREATE INDEX idx_events_person_id ON events(person_id);
        CREATE INDEX idx_events_user_id ON events(user_id);
        CREATE INDEX idx_events_date ON events(event_date DESC);
      `);
    }
    
    // Таблица для приглашений
    if (!existingTables.includes('tree_invitations')) {
      sqlStatements.push(`
        CREATE TABLE tree_invitations (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          tree_id UUID REFERENCES family_trees(id) ON DELETE CASCADE,
          inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          invitee_email VARCHAR(255) NOT NULL,
          token VARCHAR(255) NOT NULL UNIQUE,
          permissions VARCHAR(50) DEFAULT 'viewer' CHECK (permissions IN ('viewer', 'editor', 'admin')),
          status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
        );
        
        CREATE INDEX idx_invitations_tree_id ON tree_invitations(tree_id);
        CREATE INDEX idx_invitations_token ON tree_invitations(token);
        CREATE INDEX idx_invitations_status ON tree_invitations(status);
      `);
    }
    
    // Таблица для доступа к деревьям
    if (!existingTables.includes('tree_access')) {
      sqlStatements.push(`
        CREATE TABLE tree_access (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          tree_id UUID REFERENCES family_trees(id) ON DELETE CASCADE,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          permissions VARCHAR(50) DEFAULT 'viewer' CHECK (permissions IN ('viewer', 'editor', 'admin')),
          granted_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
          UNIQUE(tree_id, user_id)
        );
        
        CREATE INDEX idx_tree_access_tree_id ON tree_access(tree_id);
        CREATE INDEX idx_tree_access_user_id ON tree_access(user_id);
      `);
    }
    
    // Запускаем SQL
    for (const sql of sqlStatements) {
      try {
        const { error } = await supabaseClient.rpc('exec_sql', { sql_statement: sql });
        if (error && !error.message.includes('already exists')) {
          console.log('Ошибка выполнения SQL:', error);
        }
      } catch (e) {
        console.log('Не удалось выполнить SQL:', e.message);
      }
    }
    
    console.log('✅ Таблицы инициализированы');
    
  } catch (error) {
    console.error('Ошибка инициализации таблиц:', error);
  }
}

// Заглушка для режима разработки
function createFallbackClient() {
  console.log('⚠️ Создаем заглушку для Supabase');
  
  supabaseClient = {
    auth: {
      getUser: async () => ({ 
        data: { user: null }, 
        error: null 
      }),
      signUp: async (credentials) => {
        console.log('📝 Регистрация (заглушка):', credentials.email);
        const user = {
          id: 'demo-' + Date.now(),
          email: credentials.email,
          user_metadata: credentials.options?.data || {}
        };
        return { data: { user }, error: null };
      },
      signInWithPassword: async (credentials) => {
        console.log('🔐 Вход (заглушка):', credentials.email);
        const user = {
          id: 'demo-' + Date.now(),
          email: credentials.email,
          user_metadata: { name: credentials.email.split('@')[0] }
        };
        return { 
          data: { 
            user,
            session: { 
              access_token: 'demo-token',
              refresh_token: 'demo-refresh'
            }
          }, 
          error: null 
        };
      },
      signOut: async () => ({ error: null }),
      updateUser: async (updates) => ({ 
        data: { user: updates }, 
        error: null 
      }),
      onAuthStateChange: (callback) => {
        console.log('🔐 Auth state change listener установлен (заглушка)');
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
    },
    from: (tableName) => ({
      select: (columns = '*') => ({
        eq: (column, value) => ({
          order: (orderBy, options = { ascending: false }) => {
            console.log(`📥 Запрос из ${tableName} где ${column}=${value}`);
            return Promise.resolve({ 
              data: getDemoData(tableName), 
              error: null 
            });
          },
          single: () => {
            console.log(`📥 Single запрос из ${tableName} где ${column}=${value}`);
            const data = getDemoData(tableName);
            return Promise.resolve({ 
              data: data && data.length > 0 ? data[0] : null, 
              error: null 
            });
          },
          range: (from, to) => ({
            order: (orderBy, options = { ascending: false }) => {
              console.log(`📥 Range запрос из ${tableName}`);
              return Promise.resolve({ 
                data: getDemoData(tableName).slice(from, to + 1), 
                error: null 
              });
            }
          })
        }),
        order: (orderBy, options = { ascending: false }) => ({
          eq: (column, value) => ({
            range: (from, to) => {
              console.log(`📥 Сортировка из ${tableName}`);
              return Promise.resolve({ 
                data: getDemoData(tableName), 
                error: null 
              });
            }
          })
        }),
        range: (from, to) => {
          console.log(`📥 Range запрос из ${tableName}`);
          return Promise.resolve({ 
            data: getDemoData(tableName).slice(from, to + 1), 
            error: null 
          });
        }
      }),
      insert: (data) => {
        console.log(`💾 Вставка в ${tableName}:`, data);
        const result = Array.isArray(data) ? data.map(item => ({ 
          ...item, 
          id: 'demo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })) : { 
          ...data, 
          id: 'demo-' + Date.now(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        return Promise.resolve({ 
          data: result, 
          error: null 
        });
      },
      update: (data) => ({
        eq: (column, value) => {
          console.log(`✏️ Обновление ${tableName} где ${column}=${value}:`, data);
          return Promise.resolve({ 
            data: { ...data, updated_at: new Date().toISOString() }, 
            error: null 
          });
        }
      }),
      delete: () => ({
        eq: (column, value) => {
          console.log(`🗑️ Удаление из ${tableName} где ${column}=${value}`);
          return Promise.resolve({ 
            data: null, 
            error: null 
          });
        }
      }),
      upsert: (data) => {
        console.log(`🔄 Upsert в ${tableName}:`, data);
        return Promise.resolve({ 
          data, 
          error: null 
        });
      }
    }),
    channel: (name) => ({
      on: (event, options, callback) => {
        console.log(`🔔 Realtime канал ${name}:`, event);
        return {
          subscribe: () => ({ status: 'SUBSCRIBED' })
        };
      }
    }),
    storage: {
      from: (bucket) => ({
        upload: (path, file, options) => {
          console.log(`📤 Загрузка в ${bucket}/${path}`);
          return Promise.resolve({ 
            data: { 
              Key: `${bucket}/${path}`,
              url: URL.createObjectURL(file)
            }, 
            error: null 
          });
        },
        getPublicUrl: (path) => ({
          data: { publicUrl: `https://demo.storage.com/${bucket}/${path}` }
        })
      })
    },
    rpc: (fn, params) => {
      console.log(`🔄 RPC ${fn}:`, params);
      return Promise.resolve({ data: null, error: null });
    }
  };
}

// Демо-данные для тестирования
function getDemoData(tableName) {
  const demoData = {
    family_trees: [
      {
        id: 'demo-tree-1',
        name: 'Семья Ивановых',
        description: 'Основное семейное дерево',
        user_id: 'demo-user-1',
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-15T14:30:00Z',
        is_public: true
      }
    ],
    people: [
      {
        id: 'demo-person-1',
        tree_id: 'demo-tree-1',
        first_name: 'Иван',
        last_name: 'Иванов',
        birth_date: '1980-05-15',
        gender: 'male',
        biography: 'Основатель семьи',
        created_at: '2024-01-01T10:00:00Z'
      }
    ],
    relationships: [
      {
        id: 'demo-rel-1',
        tree_id: 'demo-tree-1',
        person1_id: 'demo-person-1',
        person2_id: 'demo-person-2',
        relationship_type: 'spouse',
        created_at: '2024-01-01T10:00:00Z'
      }
    ],
    media: [
      {
        id: 'demo-media-1',
        tree_id: 'demo-tree-1',
        person_id: 'demo-person-1',
        file_url: 'https://picsum.photos/300/300',
        file_type: 'image',
        description: 'Портрет',
        created_at: '2024-01-01T10:00:00Z'
      }
    ],
    events: [
      {
        id: 'demo-event-1',
        tree_id: 'demo-tree-1',
        person_id: 'demo-person-1',
        title: 'День рождения',
        event_type: 'birth',
        event_date: '1980-05-15',
        created_at: '2024-01-01T10:00:00Z'
      }
    ],
    tree_invitations: [],
    tree_access: []
  };
  
  return demoData[tableName] || [];
}

// Утилитные функции для работы с Supabase
async function uploadToSupabaseStorage(file, bucket = 'family-media', path = '') {
  if (!supabaseClient || !window.currentUser) {
    console.log('⚠️ Загрузка файла в режиме демо');
    return {
      success: true,
      url: URL.createObjectURL(file),
      path: `demo/${file.name}`
    };
  }
  
  try {
    const fileName = `${Date.now()}-${file.name}`.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = path ? `${path}/${fileName}` : fileName;
    
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    const { data: urlData } = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('❌ Ошибка загрузки файла:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function deleteFromSupabaseStorage(path, bucket = 'family-media') {
  if (!supabaseClient) return { success: true };
  
  try {
    const { error } = await supabaseClient.storage
      .from(bucket)
      .remove([path]);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('❌ Ошибка удаления файла:', error);
    return { success: false, error: error.message };
  }
}

// Инициализация при загрузке
setTimeout(() => {
  if (supabaseClient && !window.supabaseClient) {
    window.supabaseClient = supabaseClient;
    initializeSupabaseTables();
  }
}, 1000);

// Экспортируем функции
window.supabaseClient = supabaseClient;
window.uploadToSupabaseStorage = uploadToSupabaseStorage;
window.deleteFromSupabaseStorage = deleteFromSupabaseStorage;

console.log('✅ Supabase модуль загружен');