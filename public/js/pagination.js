// public/js/pagination.js
// Sistema de Paginação Reutilizável

/**
 * Classe para gerenciar paginação
 * Uso:
 *   const paginator = new Paginator(allItems, 10, renderCallback);
 *   paginator.render('paginationContainerId');
 */
class Paginator {
  constructor(items, itemsPerPage = 10, renderCallback) {
    this.allItems = items;
    this.itemsPerPage = itemsPerPage;
    this.renderCallback = renderCallback;
    this.currentPage = 1;
    this.totalPages = Math.ceil(items.length / itemsPerPage);
  }

  /**
   * Atualiza os dados e recalcula páginas
   */
  updateItems(items) {
    this.allItems = items;
    this.totalPages = Math.ceil(items.length / this.itemsPerPage);
    
    // Se página atual maior que total, volta para última
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages || 1;
    }
    
    this.goToPage(this.currentPage);
  }

  /**
   * Retorna os itens da página atual
   */
  getCurrentPageItems() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.allItems.slice(start, end);
  }

  /**
   * Vai para uma página específica
   */
  goToPage(page) {
    if (page < 1 || page > this.totalPages) return;
    
    this.currentPage = page;
    
    // Chama callback para renderizar os itens
    if (this.renderCallback) {
      this.renderCallback(this.getCurrentPageItems());
    }
    
    // Atualiza os controles de paginação
    this.updateControls();
  }

  /**
   * Página anterior
   */
  previousPage() {
    this.goToPage(this.currentPage - 1);
  }

  /**
   * Próxima página
   */
  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  /**
   * Renderiza os controles de paginação
   */
  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (this.totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.allItems.length);

    container.innerHTML = `
      <div class="pagination-controls">
        <div class="pagination-info">
          Mostrando ${start}-${end} de ${this.allItems.length} registros
        </div>
        <div class="pagination-buttons">
          <button 
            class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}"
            onclick="paginator.previousPage()"
            ${this.currentPage === 1 ? 'disabled' : ''}
          >
            ◀ Anterior
          </button>
          
          ${this.renderPageNumbers()}
          
          <button 
            class="pagination-btn ${this.currentPage === this.totalPages ? 'disabled' : ''}"
            onclick="paginator.nextPage()"
            ${this.currentPage === this.totalPages ? 'disabled' : ''}
          >
            Próximo ▶
          </button>
        </div>
      </div>
    `;

    this.updateControls();
  }

  /**
   * Renderiza os números de página
   */
  renderPageNumbers() {
    let pages = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      // Mostra todas as páginas
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Mostra páginas com reticências
      if (this.currentPage <= 3) {
        pages = [1, 2, 3, 4, '...', this.totalPages];
      } else if (this.currentPage >= this.totalPages - 2) {
        pages = [1, '...', this.totalPages - 3, this.totalPages - 2, this.totalPages - 1, this.totalPages];
      } else {
        pages = [1, '...', this.currentPage - 1, this.currentPage, this.currentPage + 1, '...', this.totalPages];
      }
    }

    return pages.map(page => {
      if (page === '...') {
        return '<span class="pagination-ellipsis">...</span>';
      }
      return `
        <button 
          class="pagination-page ${page === this.currentPage ? 'active' : ''}"
          onclick="paginator.goToPage(${page})"
        >
          ${page}
        </button>
      `;
    }).join('');
  }

  /**
   * Atualiza estado dos controles
   */
  updateControls() {
    // Essa função é chamada após render()
    // Já está sendo feita no render()
  }
}

// Estilos CSS para paginação (adicione ao seu CSS ou crie um arquivo pagination.css)
const paginationStyles = `
<style>
.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  flex-wrap: wrap;
  gap: 1rem;
}

.pagination-info {
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
}

.pagination-buttons {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.pagination-btn,
.pagination-page {
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  background: white;
  color: #333;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
}

.pagination-btn:hover:not(.disabled),
.pagination-page:hover:not(.active) {
  background: #f0f0f0;
  border-color: #999;
}

.pagination-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f5f5f5;
}

.pagination-page.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: #667eea;
  cursor: default;
}

.pagination-ellipsis {
  padding: 0.5rem;
  color: #999;
  font-weight: bold;
}

@media (max-width: 768px) {
  .pagination-controls {
    flex-direction: column;
  }
  
  .pagination-buttons {
    width: 100%;
    justify-content: center;
  }
}
</style>
`;

// Exporta para uso global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Paginator;
}
