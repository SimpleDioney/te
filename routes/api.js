// backend/routes/api.js (VERSÃO FINAL E CORRETA)

const express = require('express');
const router = express.Router();
const tmdbApi = require('../config/tmdb');
const authMiddleware = require('../middleware/auth');
const cache = require('../services/cache');

module.exports = (db) => {

    //=====================================================//
    // ---- ROTAS PÚBLICAS (PROXY PARA A API DO TMDB) ---- //
    //=====================================================//

    // Rota para destaques da página inicial
    router.get('/discover', cache(3600), async (req, res) => {
        try {
            const [moviesResponse, tvResponse] = await Promise.all([
                tmdbApi.get('/trending/movie/week'),
                tmdbApi.get('/trending/tv/week')
            ]);
            res.json({
                movies: moviesResponse.data.results,
                series: tvResponse.data.results
            });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar destaques do TMDB.', details: error.message });
        }
    });

    // Rota de busca genérica
    router.get('/search', async (req, res) => {
        const { query, type = 'multi', page = 1 } = req.query;
        if (!query) {
            return res.status(400).json({ message: 'Parâmetro "query" é obrigatório.' });
        }
        try {
            const response = await tmdbApi.get(`/search/${type}`, { params: { query, page } });
            res.json(response.data);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao realizar a busca no TMDB.', details: error.message });
        }
    });
    
    // ✅ NOVA ROTA DE DISCOVERY COM FILTROS AVANÇADOS
    router.get('/discover/media', cache(3600), async (req, res) => {
        const {
            type = 'movie', // 'movie' ou 'tv'
            sortBy = 'popularity.desc',
            genreId,
            year,
            rating,
            page = 1
        } = req.query;

        const params = {
            page,
            sort_by: sortBy,
            'vote_average.gte': rating,
            'vote_count.gte': 100, // Evita resultados com pouquíssimos votos
        };

        if (genreId) params.with_genres = genreId;
        
        // TMDB usa 'primary_release_year' para filmes e 'first_air_date_year' para séries
        if (year) {
            if (type === 'movie') {
                params.primary_release_year = year;
            } else {
                params.first_air_date_year = year;
            }
        }

        try {
            const response = await tmdbApi.get(`/discover/${type}`, { params });
            res.json(response.data);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar por mídia com filtros.', details: error.message });
        }
    });


    router.get('/genres', cache(86400), async (req, res) => {
        try {
            const [movieGenres, tvGenres] = await Promise.all([
                tmdbApi.get('/genre/movie/list'),
                tmdbApi.get('/genre/tv/list')
            ]);
            // Combina e remove duplicatas (alguns gêneros têm mesmo ID e nome)
            const allGenres = [...movieGenres.data.genres, ...tvGenres.data.genres];
            const uniqueGenres = Array.from(new Map(allGenres.map(item => [item.id, item])).values());
            res.json(uniqueGenres);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar gêneros do TMDB.' });
        }
    });

    router.get('/tv/:id/season/:seasonNumber', cache(86400), async (req, res) => {
        const { id, seasonNumber } = req.params;
        try {
            const response = await tmdbApi.get(`/tv/${id}/season/${seasonNumber}`);
            res.json(response.data);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar detalhes da temporada no TMDB.' });
        }
    });

    router.get('/movie/:id', cache(86400), async (req, res) => {
        const { id } = req.params;
        try {
            const response = await tmdbApi.get(`/movie/${id}`, { 
                params: { append_to_response: 'videos,credits,recommendations' }
            });
            res.json(response.data);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar detalhes do filme no TMDB.' });
        }
    });

    router.get('/tv/:id', cache(86400), async (req, res) => {
        const { id } = req.params;
        try {
            const response = await tmdbApi.get(`/tv/${id}`, { 
                params: { append_to_response: 'videos,credits,recommendations' }
            });
            res.json(response.data);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar detalhes da série no TMDB.' });
        }
    });
    
    router.get('/person/:id', cache(86400), async (req, res) => {
        const { id } = req.params;
        try {
            const response = await tmdbApi.get(`/person/${id}`, {
                params: { append_to_response: 'movie_credits,tv_credits' }
            });
            res.json(response.data);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar detalhes da pessoa no TMDB.' });
        }
    });


    //============================================================//
    // ---- ROTAS PROTEGIDAS (DADOS DO USUÁRIO NO BANCO SQLITE) ---- //
    //============================================================//

    router.get('/my-list', authMiddleware, async (req, res) => {
        try {
            const items = await db.all('SELECT tmdb_id as id, item_type, poster_path, title FROM watchlist WHERE user_id = ? ORDER BY added_at DESC', [req.user.id]);
            res.json(items);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar "Minha Lista" no banco de dados.' });
        }
    });

    router.post('/my-list', authMiddleware, async (req, res) => {
        const { tmdb_id, item_type, poster_path, title } = req.body;
        const user_id = req.user.id;

        if (!tmdb_id || !item_type || !title) {
            return res.status(400).json({ message: 'Dados do item incompletos.' });
        }

        try {
            const existing = await db.get('SELECT id FROM watchlist WHERE user_id = ? AND tmdb_id = ?', [user_id, tmdb_id]);
            
            if (existing) {
                await db.run('DELETE FROM watchlist WHERE id = ?', [existing.id]);
                res.json({ message: 'Item removido da lista.', action: 'removed' });
            } else {
                await db.run(
                    'INSERT INTO watchlist (user_id, tmdb_id, item_type, poster_path, title) VALUES (?, ?, ?, ?, ?)',
                    [user_id, tmdb_id, item_type, poster_path, title]
                );
                res.status(201).json({ message: 'Item adicionado à lista.', action: 'added' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Erro ao atualizar "Minha Lista" no banco de dados.' });
        }
    });

    router.get('/history', authMiddleware, async (req, res) => {
        try {
            const items = await db.all('SELECT tmdb_id as id, item_type, poster_path, title, progress, season_number, episode_number FROM history WHERE user_id = ? ORDER BY last_watched DESC', [req.user.id]);
            res.json(items);
        } catch (error) {
            res.status(500).json({ message: 'Erro ao buscar histórico no banco de dados.' });
        }
    });

    router.post('/history', authMiddleware, async (req, res) => {
        const { tmdb_id, item_type, poster_path, title, progress, season_number, episode_number } = req.body;
        const user_id = req.user.id;

        if (!tmdb_id || !item_type || !title || progress === undefined) {
            return res.status(400).json({ message: 'Dados de histórico incompletos.' });
        }

        // Garante que filmes tenham season/episode como 0 para a constraint
        const s_num = season_number || 0;
        const e_num = episode_number || 0;

        try {
            await db.run(`
                INSERT INTO history (user_id, tmdb_id, item_type, poster_path, title, progress, season_number, episode_number, last_watched)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(user_id, tmdb_id, season_number, episode_number) DO UPDATE SET
                    progress = excluded.progress,
                    last_watched = CURRENT_TIMESTAMP;
            `, [user_id, tmdb_id, item_type, poster_path, title, progress, s_num, e_num]);
            
            res.status(200).json({ message: 'Progresso salvo com sucesso.' });
        } catch (error) {
            res.status(500).json({ message: 'Erro ao salvar progresso no banco de dados.', details: error.message });
        }
    });

    return router;
};